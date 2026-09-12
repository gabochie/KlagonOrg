// KlagonOrg payments relay — Moolre webhook receiver (+ charge endpoint later).
//
// Secrets (wrangler secret put): SUPABASE_ANON_KEY, CALLBACK_KEY,
//   MOOLRE_USER, MOOLRE_PUBKEY, MOOLRE_PRIVKEY (added when keys arrive).

const MOOLRE_WALLET_CALLBACK_IP = "192.241.135.134";

const PAID_SIGNALS = new Set(["success", "successful", "completed", "paid", "1"]);
const FAILED_SIGNALS = new Set(["failed", "failure", "cancelled", "canceled", "rejected", "0"]);

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

    if (url.pathname === "/health") return json({ ok: true });

    return json({ error: "not-found" }, 404);
  },
};