// KlagonOrg payments relay — Moolre webhook receiver + donation charge endpoint.
//
// Secrets (wrangler secret put): SUPABASE_ANON_KEY, CALLBACK_KEY,
//   MOOLRE_USER, MOOLRE_PUBKEY, MOOLRE_PRIVKEY, MOOLRE_WALLET.

const MOOLRE_WALLET_CALLBACK_IP = "192.241.135.134";
const MOOLRE_API = "https://api.moolre.com/open/transact/payment";

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

async function handleCallback(request, env) {
  const url = new URL(request.url);

  // Shared-secret gate: the secret is embedded in the callback URL query
  // (?key=...) stored in Moolre, so random POSTs can't flip donations.
  if (!env.CALLBACK_KEY || url.searchParams.get("key") !== env.CALLBACK_KEY) {
    return json({ error: "forbidden" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad-json" }, 400);
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
  const failed = FAILED_SIGNALS.has(txstatus) || (!paid && txstatus !== "" && !PAID_SIGNALS.has(txstatus));

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
      // GET so URL-verification pings (if any) get a 200, not a 404.
      if (request.method === "GET") return json({ ok: true, service: "klagon-payments" });
      if (request.method === "POST") return handleCallback(request, env);
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

    if (url.pathname === "/health") return json({ ok: true });

    return json({ error: "not-found" }, 404);
  },
};