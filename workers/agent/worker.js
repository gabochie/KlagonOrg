// KlagonOrg AI sales agent — "Ama".
// A free membership-lead capture assistant for visitors on klagon.org.
//
// Endpoint:
//   POST /api/agent/turn   { messages, user?, persistLead? } -> { reply, intent } | { saved }
//   GET  /health
//
// Secrets (wrangler secret put): SUPABASE_ANON_KEY,
//   optional TURNSTILE_SECRET (bot protection).

const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

// Browsers allowed to call the agent (the site + its previews).
function corsHeaders(origin) {
  const allowed =
    origin === "https://klagon.org" ||
    origin === "https://www.klagon.org" ||
    (typeof origin === "string" && origin.endsWith(".klagon-org.pages.dev"));
  return {
    "Content-Type": "application/json",
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-Key",
  };
}

function json(obj, status = 200, origin = "") {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders(origin) });
}

// ------------------------------------------------------------------
// "Ama" system prompt
// ------------------------------------------------------------------

function systemPrompt(env, user) {
  const known =
    user?.name && user?.name.trim()
      ? ` Known caller: ${String(user.name).trim()}${
          user?.isMember ? ` (member, approved)` : " (not a member yet)"
        }.`
      : "";
  return [
    "You are Ama, a warm, friendly voice-and-text assistant for KlagonOrg in Klagon, Greater Accra, Ghana.",
    "KlagonOrg is a FREE community organisation helping youth build skills and become members.",
    "Facts you may use:",
    "- Membership is 100% free; register at klagon.org.",
    "- Free courses: AI & Tech, Financial Literacy, Leadership, Entrepreneurship, Communication, and Career.",
    "- Weekly workshops and events at the Community Center in Klagon.",
    "- Contact: hello@klagon.org, WhatsApp +233 26 870 8895, call +233 24 326 2019.",
    "",
    "Conversation style:",
    "- Identify as 'KlagonOrg's AI assistant' if asked. Be encouraging and plain-English with a light Ghanaian warmth.",
    "- Keep replies SHORT: 1 to 3 sentences. Never invent facts, prices, jobs, or outcomes.",
    "- When someone wants to join, collect their first name, a Ghana phone number (0XX... or +233...), and an email address — ask ONE at a time and wait for each.",
    "- If the caller is under 18, do NOT insist on a phone number; encourage signing up on the site with a parent or guardian.",
    "- Never ask for passwords, ID numbers, or payment details.",
    "",
    "Output rule: end your reply with EXACTLY one extra line: LEAD:null (when you captured no new contact details this turn) or LEAD:{...} with only the fields you have so far, JSON with null for missing, e.g.",
    'LEAD:{"name":"Kofi","phone":"0245555555","email":"kofi@example.com"}',
    `Known membership context:${known}`,
  ].join("\n");
}

function parseLead(reply) {
  const m = String(reply).match(/LEAD\s*:\s*(\{.*?\}|null)/s);
  if (!m || m[1] === "null") return { name: null, phone: null, email: null };
  try {
    const o = JSON.parse(m[1]);
    return {
      name: typeof o?.name === "string" && o.name.trim() ? o.name.trim() : null,
      phone: typeof o?.phone === "string" && o.phone.trim() ? o.phone.trim() : null,
      email: typeof o?.email === "string" && o.email.trim() ? o.email.trim().toLowerCase() : null,
    };
  } catch {
    return { name: null, phone: null, email: null };
  }
}

// ------------------------------------------------------------------
// Turnstile: verify a visitor token server-side.
// Uses our own TURNSTILE_SECRET when present; otherwise proxies to the
// payments worker, which already holds the widget secret.
// Verdict: "ok" | "denied" | "unreachable" (fail-open only on network error)
// ------------------------------------------------------------------

const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(env, token) {
  if (env.TURNSTILE_SECRET) {
    const res = await fetch(TURNSTILE_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-json */ }
    return data?.success === true ? "ok" : "denied";
  }
  return "skipped";
}

// ------------------------------------------------------------------
// rate limiting
//   - in-memory fixed window: exact first-line guard, per isolate
//     (catches sequential hammering and the common single-bot case)
//   - KV fixed window: cluster-wide cap on sustained abuse over a long
//     window (e.g. hourly/daily). KV is eventually consistent, so it is
//     NOT a burst limiter — it caps total usage, which is what protects
//     the LLM budget. This is Cloudflare's documented free-tier recipe.
// ------------------------------------------------------------------

function clientIp(request) {
  return String(request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? "unknown").split(",")[0].trim();
}

const memBuckets = new Map(); // `${bucket}:${key}:${slot}` -> { count, slot }

async function rateLimited(env, bucket, key, memLimit, memWindowSeconds, kvLimit, kvWindowSeconds) {
  const now = Math.floor(Date.now() / 1000);

  // in-memory (per isolate)
  const per = memBuckets.get(bucket)?.get(key) ?? null;
  if (per && per.slot === Math.floor(now / memWindowSeconds) && per.count >= memLimit) return true;
  const slot = Math.floor(now / memWindowSeconds);
  const cur = per && per.slot === slot ? per.count + 1 : 1;
  if (!memBuckets.has(bucket)) memBuckets.set(bucket, new Map());
  if (memBuckets.get(bucket).size > 50000) memBuckets.get(bucket).clear();
  memBuckets.get(bucket).set(key, { count: cur, slot });

  // KV backstop (long window, cluster-wide)
  if (env.AGENT_RATE && kvLimit && kvWindowSeconds) {
    const k = `${bucket}:${key}:${Math.floor(now / kvWindowSeconds)}`;
    try {
      const kvCur = parseInt((await env.AGENT_RATE.get(k)) ?? "0", 10);
      if (!Number.isNaN(kvCur) && kvCur >= kvLimit) return true;
      await env.AGENT_RATE.put(k, String(kvCur + 1), { expirationTtl: kvWindowSeconds * 2 });
    } catch {
      /* KV hiccup: fail open, in-memory guard still applies */
    }
  }
  return false;
}

// bounds
//  - turn: 60/min per isolate + 240/hour per IP cluster-wide
//  - lead: 10/hour per isolate + 50/day per IP cluster-wide
const TURN_RL = { memLimit: 2, memWindow: 60, kvLimit: 240, kvWindow: 3600 };
const LEAD_RL = { memLimit: 10, memWindow: 3600, kvLimit: 50, kvWindow: 86400 };

// ------------------------------------------------------------------
// turn: persist a consented lead, OR run the LLM + extract intent
// ------------------------------------------------------------------

async function handleTurn(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const ip = clientIp(request);

  if (await rateLimited(env, "turn", ip, TURN_RL.memLimit, TURN_RL.memWindow, TURN_RL.kvLimit, TURN_RL.kvWindow)) {
    return json({ error: "rate-limited" }, 429, origin);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Send messages." }, 400, origin);
  }

  // Bot protection: when a Turnstile secret is present, every request must
  // carry a valid token (server-side siteverify). Without a secret, the
  // browser widget pre-verifies against the existing payments-worker webhook
  // and the rate limiter below is the primary hard boundary.
  if (env.TURNSTILE_SECRET) {
    const token = typeof input?.token === "string" ? input.token.trim() : "";
    if (!token) return json({ error: "missing-turnstile-token" }, 400, origin);
    const verdict = await verifyTurnstile(env, token);
    if (verdict === "denied") return json({ error: "turnstile-failed" }, 403, origin);
  }

  // Consent-gated persist: the visitor explicitly approved saving these details.
  if (input && typeof input?.persistLead === "object" && input.persistLead !== null) {
    if (await rateLimited(env, "lead", ip, LEAD_RL.memLimit, LEAD_RL.memWindow, LEAD_RL.kvLimit, LEAD_RL.kvWindow)) {
      return json({ error: "rate-limited" }, 429, origin);
    }
    return persistLead(env, input.persistLead, origin);
  }

  const messages = Array.isArray(input?.messages) ? input.messages : null;
  if (!messages || messages.length === 0) {
    return json({ error: "Send messages." }, 400, origin);
  }

  const user = input?.user && typeof input.user === "object" ? input.user : {};
  const system = { role: "system", content: systemPrompt(env, user) };

  try {
    const res = await env.AI.run(MODEL, {
      messages: [system, ...messages],
      max_tokens: 320,
      temperature: 0.8,
      top_p: 0.9,
    });
    const full = String(res?.response ?? res?.content ?? "").trim();
    const reply = full.replace(/LEAD\s*:\s*(\{.*?\}|null)/s, "").trim();
    return json({ reply, intent: parseLead(full) }, 200, origin);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Agent unavailable" },
      502,
      origin
    );
  }
}

// ------------------------------------------------------------------
// persistLead: write a consent-approved lead into Supabase
// ------------------------------------------------------------------

function looksLikePhone(v) {
  if (typeof v !== "string") return false;
  const digits = String(v).replace(/[\s\-()]/g, "");
  return /^\+?[0-9]{8,15}$/.test(digits);
}

function looksLikeEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

async function persistLead(env, lead, origin) {
  const name = typeof lead?.name === "string" ? lead.name.trim().slice(0, 120) : null;
  const email =
    typeof lead?.email === "string" ? lead.email.trim().slice(0, 200).toLowerCase() : null;
  const phone = typeof lead?.phone === "string" ? lead.phone.trim().slice(0, 24) : null;
  const source =
    typeof lead?.source === "string" ? lead.source.trim().slice(0, 60) : "voice-agent";
  const intent = typeof lead?.intent === "string" ? lead.intent.trim().slice(0, 240) : null;
  const profileId = typeof lead?.profile_id === "string" ? lead.profile_id : null;

  if (email && !looksLikeEmail(email)) {
    return json({ ok: false, error: "invalid-email" }, 400, origin);
  }
  if (phone && !looksLikePhone(phone)) {
    return json({ ok: false, error: "invalid-phone" }, 400, origin);
  }
  if (!email && !phone) {
    return json({ ok: false, error: "lead-needs-email-or-phone" }, 400, origin);
  }

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/log_agent_lead`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_name: name,
        p_phone: phone,
        p_email: email,
        p_source: source,
        p_intent: intent,
        p_profile_id: profileId,
      }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 200);
      return json({ ok: false, detail }, 502, origin);
    }
    const body = await res.json();
    const id = typeof body === "object" && body !== null ? body.id ?? null : body;
    return json({ ok: true, saved: true, id }, 200, origin);
  } catch (err) {
    return json(
      { ok: false, error: err instanceof Error ? err.message : "lead-save-failed" },
      502,
      origin
    );
  }
}

// ------------------------------------------------------------------
// entry
// ------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/api/agent/turn" && request.method === "POST") {
      return handleTurn(request, env);
    }

    if (url.pathname === "/health") return json({ ok: true });
    if (url.pathname === "/debug") {
      const ip = clientIp(request);
      const turnKey = `turn:${ip}:${Math.floor(Date.now() / 1000 / 3600)}`;
      const raw = (await env.AGENT_RATE?.get(turnKey)).catch?.(() => null) ?? null;
      let kvWrite = "n/a";
      let kvRead = null;
      try {
        const probeKey = `probe:${Math.random().toString(36).slice(2)}`;
        await env.AGENT_RATE?.put(probeKey, "1", { expirationTtl: 60 });
        kvWrite = "ok";
        kvRead = await env.AGENT_RATE.get(probeKey);
      } catch (e) {
        kvWrite = e instanceof Error ? e.message : String(e);
      }
      return json({ ok: true, hasKV: Boolean(env.AGENT_RATE), kvWrite, kvRead, turnKey, turnCount: raw });
    }

    return json({ error: "not-found" }, 404);
  },
};