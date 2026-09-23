// KlagonOrg team notifications — zero-cost email alerts (Email Sending binding).
//
// Fired by the static site after a lead is saved to Supabase, so the team is
// poked in near-real time without paying for a marketing platform.
//
// POST /api/notify { type, fields } -> { ok: true }
//   type   in ALLOWED_TYPES
//   fields flat map of strings (name, phone, email, amount, frequency, ...)
//   Every request is rate-limited per IP (in-memory + KV backstop).

const FROM = { email: "notifications@klagon.org", name: "KLAGON.org" };

const ALLOWED_TYPES = ["pledge", "contact", "sponsor", "mentor"];

const SUBJECTS = {
  pledge: "New donation pledge on klagon.org",
  contact: "New contact message on klagon.org",
  sponsor: "New sponsorship inquiry on klagon.org",
  mentor: "New mentor application on klagon.org",
};

const MAX_FIELDS = 12;
const MAX_FIELD_LEN = 500;

function corsHeaders(origin) {
  const allowed =
    origin === "https://klagon.org" ||
    origin === "https://www.klagon.org" ||
    (typeof origin === "string" && origin.endsWith(".klagon-org.pages.dev"));
  return {
    "Content-Type": "application/json",
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status = 200, origin = "") {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders(origin) });
}

function clientIp(request) {
  return String(
    request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? "unknown"
  )
    .split(",")[0]
    .trim();
}

const memBuckets = new Map();

async function rateLimited(env, key, memLimit, memWindowSeconds, kvLimit, kvWindowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const per = memBuckets.get(key) ?? null;
  const slot = Math.floor(now / memWindowSeconds);
  if (per && per.slot === slot && per.count >= memLimit) return true;
  const cur = per && per.slot === slot ? per.count + 1 : 1;
  if (memBuckets.size > 25000) memBuckets.clear();
  memBuckets.set(key, { count: cur, slot });

  if (env.NOTIFY_RATE && kvLimit && kvWindowSeconds) {
    const k = `${key}:${Math.floor(now / kvWindowSeconds)}`;
    try {
      const curKV = parseInt((await env.NOTIFY_RATE.get(k)) ?? "0", 10);
      if (!Number.isNaN(curKV) && curKV >= kvLimit) return true;
      await env.NOTIFY_RATE.put(k, String(curKV + 1), { expirationTtl: kvWindowSeconds * 2 });
    } catch {
      /* KV hiccup: fail open, in-memory guard still applies */
    }
  }
  return false;
}

function cleanFields(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  let count = 0;
  for (const key of Object.keys(raw)) {
    if (count >= MAX_FIELDS) break;
    if (typeof raw[key] !== "string") continue;
    const val = raw[key].trim();
    if (!val) continue;
    out[key] = val.length > MAX_FIELD_LEN ? val.slice(0, MAX_FIELD_LEN) : val;
    count += 1;
  }
  return out;
}

function buildEmail(type, fields) {
  const rows = Object.entries(fields)
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#667;font-size:12px">${k}</td><td style="padding:6px 0;font-weight:600;color:#111">${String(v).replace(/</g, "&lt;")}</td></tr>`)
    .join("");
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto">
  <h2 style="color:#123;margin:0 0 12px">${SUBJECTS[type]}</h2>
  <table style="width:100%;border-collapse:collapse">${rows}</table>
  <p style="font-size:12px;color:#999;margin-top:16px">Automated alert from klagon.org</p>
</div>`;
  const text = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return { subject: SUBJECTS[type], html, text };
}

async function handleNotify(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Send JSON." }, 400, origin);
  }

  const type = typeof data?.type === "string" ? data.type.trim() : "";
  if (!ALLOWED_TYPES.includes(type)) {
    return json({ error: "Unknown type." }, 400, origin);
  }

  if (!env.TO_EMAIL) return json({ error: "not-configured" }, 503, origin);

  if (await rateLimited(env, `notify:${type}`, 5, 60, 20, 3600)) {
    return json({ error: "rate-limited" }, 429, origin);
  }

  const fields = cleanFields(data?.fields);
  if (Object.keys(fields).length === 0) {
    return json({ error: "No fields." }, 400, origin);
  }

  try {
    const email = buildEmail(type, fields);
    await env.EMAIL.send({
      to: env.TO_EMAIL,
      from: FROM,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return json({ ok: true }, 200, origin);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "send-failed" },
      502,
      origin
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/api/notify" && request.method === "POST") {
      return handleNotify(request, env);
    }

    if (url.pathname === "/health") return json({ ok: true });

    return json({ error: "not-found" }, 404);
  },
};