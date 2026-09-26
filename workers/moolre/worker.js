// KlagonOrg payments relay — Moolre webhook receiver + donation charge endpoint.
//
// Secrets (wrangler secret put): SUPABASE_ANON_KEY, CALLBACK_KEY,
//   MOOLRE_USER, MOOLRE_PUBKEY, MOOLRE_PRIVKEY, MOOLRE_WALLET, TURNSTILE_SECRET,
//   BREVO_API_KEY.

const MOOLRE_WALLET_CALLBACK_IP = "192.241.135.134";
const MOOLRE_API = "https://api.moolre.com/open/transact/payment";
const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const PAID_SIGNALS = new Set(["success", "successful", "completed", "paid", "1"]);
const FAILED_SIGNALS = new Set(["failed", "failure", "cancelled", "canceled", "rejected", "0"]);

// Browsers allowed to call the charge endpoint (the site + its previews).
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

const CHANNELS = { mtn: "13", telecel: "6", at: "7" };

function normalizeGhPhone(raw) {
  const digits = String(raw ?? "").replace(/[\s-]/g, "");
  if (/^0\d{9}$/.test(digits)) return digits;
  const m = digits.match(/^\+233(\d{9})$/);
  if (m) return `0${m[1]}`;
  return null;
}

const failRow = (env, ref) =>
  fetch(`${env.SUPABASE_URL}/rest/v1/rpc/confirm_donation_by_ref`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_ref: ref, p_status: "failed" }),
  }).catch(() => null);

const BREVO_API = "https://api.brevo.com/v3/smtp/email";
const BREVO_FROM = { name: "KlagonOrg Team", email: "hello@klagon.org" };

async function brevoSend(env, to, subject, html) {
  if (!env.BREVO_API_KEY || !to?.length) return null;
  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ sender: BREVO_FROM, to, subject, htmlContent: html }),
  });
  return res.json();
}

async function sendDonationEmails(env, ref) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/get_donation_sendable`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_ref: ref }),
  });
  const row = res.ok ? (await res.json())[0] : null;
  if (!row) return;

  const amount = Number(row.amount_ghs ?? 0).toFixed(2);
  const rowName = String(row.full_name || "").trim();
  const name = rowName ? rowName.split(" ")[0] : "Friend";

  if (row.email) {
    await brevoSend(
      env,
      [{ email: String(row.email).trim(), name }],
      `Your KlagonOrg donation of GH₵${amount}`,
      `<p>Hi ${name},</p><p>Thank you for your donation of <strong>GH\u00a5${amount}</strong> to KlagonOrg (ref <code>${ref}</code>).</p><p>Your support helps advance our mission. Follow progress at <a href="https://klagon.org">klagon.org</a>.</p>`
    ).catch(() => null);
  }

  await brevoSend(
    env,
    [{ email: "klagonorg@gmail.com", name: "KlagonOrg Admin" }],
    `New donation received — GH₵${amount}`,
    `<p>Reference: <code>${ref}</code></p><p>Name: ${rowName || "Anonymous"}</p><p>Amount: GH\u00a5${amount}</p><p>Email: ${row.email || "—"}</p>`
  ).catch(() => null);
}

// ---------- visitor auto-replies (lead-gen Phase 3) ----------
// DEPLOY: `npx wrangler deploy` from workers/moolre (needs Cloudflare auth),
// then `wrangler secret put FOLLOWUP_KEY` (any random string) alongside the
// existing BREVO_API_KEY. Delivery per event via Supabase Dashboard →
// Database → Webhooks: POST to /api/followup/autoreply on INSERT into
// donations / inkind_offers / contact_messages / sponsor_applications /
// mentor_applications / volunteer_applications with HTTP headers
// {"x-followup-key": "<FOLLOWUP_KEY>"} and a JSON body of
// {"kind": "<template>", "to": "<email>", "name": "...", "ref": "..."}.
// Until wired, the site works unchanged (in-app + manual WhatsApp only).
const AUTOREPLY_TEMPLATES = {
  pledge: {
    subject: (name) => `Medase ${name}! Your KLAGON.org pledge is in 🙏`,
    html: (name, ref) =>
      `<p>Hi ${name},</p><p>Medase — your pledge${ref ? ` (ref <code>${ref}</code>)` : ""} is recorded. We call or WhatsApp you within 24 hours to complete it by MoMo. Every cedi funds KLAGON.org programs.</p><p><a href="https://klagon.org/impact">See what your gift builds →</a></p>`,
  },
  inkind: {
    subject: (name) => `Medase ${name}! Your gift offer is in 🎁`,
    html: (name) =>
      `<p>Hi ${name},</p><p>Medase for offering your gift to Klagon! Our team replies within 48 hours to arrange collection or next steps.</p><p><a href="https://klagon.org/impact">See what gifts like yours build →</a></p>`,
  },
  contact: {
    subject: (name) => `We got your message, ${name} ✉️`,
    html: (name) =>
      `<p>Hi ${name},</p><p>Thanks for writing to KLAGON.org — a real person replies within 24 hours. Anything urgent, WhatsApp 026 870 8895.</p>`,
  },
  sponsor: {
    subject: (name) => `Medase ${name} — your sponsorship enquiry is in 🤝`,
    html: (name) =>
      `<p>Hi ${name},</p><p>Thanks for your interest in partnering with KLAGON.org. Our partnerships team finalizes details within 2 business days.</p><p><a href="https://klagon.org/impact">Our impact, in live numbers →</a></p>`,
  },
  mentor: {
    subject: (name) => `Medase ${name} — mentor application received 🎉`,
    html: (name) =>
      `<p>Hi ${name},</p><p>Your KLAGON.org mentor application is under review — we confirm within 48 hours. Medase for stepping up for Klagon's youth.</p>`,
  },
  volunteer: {
    subject: (name) => `Medase ${name} — volunteer application received 🙋`,
    html: (name) =>
      `<p>Hi ${name},</p><p>Your volunteer application is under review (ID verification first). We confirm within a few days — track it any time in your dashboard.</p>`,
  },
  newsletter: {
    subject: () => `Welcome to KLAGON.org news 📰`,
    html: () =>
      `<p>You're on the list — community news and new listings, once a month, no spam.</p><p>Meanwhile: <a href="https://klagon.org/learning">learn something free</a> or <a href="https://klagon.org/volunteer">volunteer</a>.</p>`,
  },
};

function firstTokenName(name) {
  const n = String(name || "").trim().split(" ")[0];
  return n || "Friend";
}

async function handleAutoreply(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  if (!env.FOLLOWUP_KEY || request.headers.get("x-followup-key") !== env.FOLLOWUP_KEY) {
    return json({ error: "forbidden" }, 403);
  }
  const tpl = AUTOREPLY_TEMPLATES[body.kind];
  const to = String(body.to || "").trim();
  if (!tpl || !to) return json({ error: "unknown-kind" }, 400);
  const name = firstTokenName(body.name);
  const result = await brevoSend(
    env,
    [{ email: to, name }],
    tpl.subject(name),
    tpl.html(name, body.ref)
  ).catch(() => null);
  return json({ ok: true, result });
}

async function moolreCollect(env, { channel, payer, amount, ref, network, otp }) {
  const res = await fetch(MOOLRE_API, {
    method: "POST",
    headers: {
      "X-API-USER": env.MOOLRE_USER,
      "X-API-PUBKEY": env.MOOLRE_PUBKEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: 1,
      channel,
      currency: "GHS",
      payer,
      amount: String(amount),
      externalref: ref,
      ...(otp ? { otpcode: String(otp) } : {}),
      reference: `KlagonOrg donation ${ref}`,
      accountnumber: env.MOOLRE_WALLET,
    }),
  });
  return res.json();
}

async function handleCharge(request, env) {
  const origin = request.headers.get("Origin") ?? "";

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Send amount, phone and network." }, 400, origin);
  }

  const amount = Number(input?.amount_ghs);
  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ error: "Enter a valid amount." }, 400, origin);
  }
  const channel = CHANNELS[String(input?.network ?? "").toLowerCase()];
  if (!channel) {
    return json({ error: "Choose MTN, Telecel or AT." }, 400, origin);
  }
  const payer = normalizeGhPhone(input?.phone);
  if (!payer) {
    return json({ error: "Enter a valid 10-digit Ghana phone number." }, 400, origin);
  }

  if (!env.MOOLRE_USER || !env.MOOLRE_PUBKEY || !env.MOOLRE_WALLET) {
    return json({ error: "Online payments are not switched on yet. Please try again later." }, 503, origin);
  }

  const ref = `KLG-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();

  // 1) Pending row first (anon insert allowed for status='pending' by RLS).
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/donations`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        amount_ghs: amount,
        tier_id: input?.tier_id ?? null,
        full_name: input?.full_name || null,
        phone: payer,
        email: input?.email || null,
        status: "pending",
        provider: "moolre",
        provider_ref: ref,
        metadata: { network: String(input.network).toLowerCase() },
      }),
    });
    if (!res.ok) {
      return json({ error: "Could not start your donation. Please try again." }, 502, origin);
    }
  } catch {
    return json({ error: "Could not start your donation. Please try again." }, 502, origin);
  }

  // 2) Fire the payment request.
  let moolre;
  try {
    moolre = await moolreCollect(env, { channel, payer, amount, ref, network: input.network });
  } catch {
    await failRow(env, ref);
    return json({ error: "Payment service unreachable. Please try again." }, 502, origin);
  }

  const code = moolre?.code ? String(moolre.code) : "";
  if (moolre?.status == 1) {
    if (code === "TR099") {
      return json({ ok: true, ref, payer, message: "prompt-sent" }, 200, origin);
    }
    if (code === "TP14") {
      // OTP required: keep the row pending; the donor enters the SMS code next.
      return json({ ok: true, ref, payer, otp_required: true, message: "otp-required" }, 200, origin);
    }
    // Any other success-family code (e.g. TP17) = initiated; callback settles it.
    return json({ ok: true, ref, payer, message: "initiated" }, 200, origin);
  }

  await failRow(env, ref);
  return json(
    {
      error: moolre?.message ? String(moolre.message) : "Payment request failed. Please try again.",
      code,
    },
    502,
    origin
  );
}

async function handleConfirm(request, env) {
  const origin = request.headers.get("Origin") ?? "";

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Send ref and otp." }, 400, origin);
  }

  const ref = String(input?.ref ?? "").trim();
  const otp = String(input?.otp ?? "").replace(/\s/g, "");
  if (!ref || otp.length < 4) {
    return json({ error: "Enter the full OTP from the SMS." }, 400, origin);
  }
  const amount = Number(input?.amount_ghs);
  const channel = CHANNELS[String(input?.network ?? "").toLowerCase()];
  const payer = normalizeGhPhone(input?.phone);

  let moolre;
  try {
    moolre = await moolreCollect(env, {
      channel: channel ?? "13",
      payer: payer ?? input?.phone,
      amount: Number.isFinite(amount) && amount > 0 ? amount : input?.amount_ghs,
      ref,
      network: input?.network,
      otp,
    });
  } catch {
    return json({ error: "Payment service unreachable. Please try again." }, 502, origin);
  }

  const code = moolre?.code ? String(moolre.code) : "";
  if (moolre?.status == 1) {
    return json({ ok: true, ref, message: code === "TR099" ? "prompt-sent" : "initiated" }, 200, origin);
  }

  return json(
    {
      error: moolre?.message ? String(moolre.message) : "Verification failed. Check the code and try again.",
      code,
    },
    400,
    origin
  );
}

async function handleTurnstileVerify(request, env) {
  const origin = request.headers.get("Origin") ?? "";

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Send a token." }, 400, origin);
  }

  if (!env.TURNSTILE_SECRET) {
    return json({ success: false, error: "turnstile-not-configured" }, 503, origin);
  }

  const token = String(input?.token ?? "").trim();
  if (!token) {
    return json({ error: "Send a token." }, 400, origin);
  }

  const remoteip = String(input?.remoteip ?? "").trim() || (request.headers.get("CF-Connecting-IP") ?? "");

  try {
    const res = await fetch(TURNSTILE_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
    });
    const data = await res.json();
    return json({ success: data?.success === true, codes: data?.["error-codes"] ?? [] }, 200, origin);
  } catch {
    return json({ success: false, error: "verify-unreachable" }, 502, origin);
  }
}

async function handleCallback(request, env) {
  const url = new URL(request.url);

  // Shared-secret gate: the secret is embedded in the callback URL query
  // (?key=...) stored in Moolre, so random POSTs can't flip donations.
  if (!env.CALLBACK_KEY || url.searchParams.get("key") !== env.CALLBACK_KEY) {
    return json({ error: "forbidden" }, 403);
  }

  let body;
  if (request.method === "GET") {
    const q = url.searchParams;
    body = {
      externalref: q.get("externalref") ?? q.get("external_ref") ?? q.get("ref"),
      status: q.get("txstatus") ?? q.get("status"),
      code: q.get("code"),
    };
  } else if (request.method === "POST") {
    const ct = request.headers.get("Content-Type") ?? "";
    try {
      if (ct.includes("form-")) {
        const form = await request.formData();
        const pick = (k) => {
          const v = form.get(k);
          return typeof v === "string" ? v : null;
        };
        body = {
          data: {
            externalref: pick("externalref") ?? pick("external_ref") ?? pick("ref"),
            txstatus: pick("txstatus") ?? pick("status"),
            code: pick("code"),
          },
        };
      } else {
        body = await request.json();
      }
    } catch {
      return json({ error: "bad-json" }, 400);
    }
  } else {
    return json({ error: "method-not-allowed" }, 405);
  }

  const data = body?.data && typeof body.data === "object" ? body.data : {};
  const ref =
    data.externalref ?? data.external_ref ?? body?.externalref ?? body?.external_ref ?? null;
  if (!ref || typeof ref !== "string") {
    return json({ ok: true, ignored: "no-reference" });
  }

  const txstatus = String(data.txstatus ?? data.status ?? body?.status ?? "").toLowerCase();
  const code = String(body?.code ?? data.code ?? "");
  const paid = PAID_SIGNALS.has(txstatus) || code === "P01";
  const failed = FAILED_SIGNALS.has(txstatus);

  // Ambiguous statuses (e.g. still pending) -> acknowledge but change nothing.
  if (!paid && !failed) {
    return json({ ok: true, ignored: "ambiguous-status", ref });
  }
  const finalStatus = paid ? "paid" : "failed";

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/confirm_donation_by_ref`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_ref: ref, p_status: finalStatus }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 200);
      return json({ error: "supabase-update-failed", detail }, 502);
    }
    if (finalStatus === "paid") {
      await sendDonationEmails(env, ref).catch(() => null);
    }
  } catch {
    return json({ error: "upstream-error" }, 502);
  }

  return json({
    ok: true,
    ref,
    status: finalStatus,
    fromMoolreIp: request.headers.get("CF-Connecting-IP") === MOOLRE_WALLET_CALLBACK_IP,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/moolre/callback") {
      if (request.method === "GET" || request.method === "POST") {
        return handleCallback(request, env);
      }
      return json({ error: "method-not-allowed" }, 405);
    }

    if (url.pathname === "/api/donations/charge") {
      const origin = request.headers.get("Origin") ?? "";
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      }
      if (request.method === "POST") return handleCharge(request, env);
      return json({ error: "method-not-allowed" }, 405, origin);
    }

    if (url.pathname === "/api/donations/confirm") {
      const origin = request.headers.get("Origin") ?? "";
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      }
      if (request.method === "POST") return handleConfirm(request, env);
      return json({ error: "method-not-allowed" }, 405, origin);
    }

    if (url.pathname === "/api/turnstile/verify") {
      const origin = request.headers.get("Origin") ?? "";
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      }
      if (request.method === "POST") return handleTurnstileVerify(request, env);
      return json({ error: "method-not-allowed" }, 405, origin);
    }

    if (url.pathname === "/api/followup/autoreply") {
      if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
      return handleAutoreply(request, env);
    }

    if (url.pathname === "/api/email/test") {
      if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);
      if (request.headers.get("x-test-key") !== env.EMAIL_TEST_KEY) {
        return json({ error: "forbidden" }, 403);
      }
      const result = await brevoSend(
        env,
        [{ email: "klagonorg@gmail.com", name: "Gideon" }],
        "KlagonOrg worker Brevo test",
        "<p>If you see this, the Cloudflare Worker can send via Brevo.</p>"
      ).catch(() => null);
      return json({ ok: true, result });
    }

    if (url.pathname === "/health") return json({ ok: true });

    return json({ error: "not-found" }, 404);
  },
};