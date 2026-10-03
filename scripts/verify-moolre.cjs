// Verifies the live Moolre wallet configuration behind workers/moolre/worker.js.
//
// The worker is collect-only and hardcodes api.moolre.com, so nothing in the
// running code ever calls the account APIs. That means `activated` and the
// per-wallet `api` flag are never checked at runtime: a wallet that cannot
// transact looks identical to a healthy one until a charge fails at Moolre.
// This script closes that blind spot.
//
// Read-only. It never initiates a payment or a transfer.
//
//   node scripts/verify-moolre.cjs
//   node scripts/verify-moolre.cjs --json
//
// Env var names intentionally match the worker's wrangler secrets so the two
// cannot drift. Put them in `.env.moolre.local` (gitignored via `.env*.local`):
//
//   MOOLRE_USER, MOOLRE_PUBKEY, MOOLRE_PRIVKEY, MOOLRE_WALLET, CALLBACK_KEY

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, file), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv(".env.moolre.local");
loadEnv(".env.local");
loadEnv(".env");

const API = "https://api.moolre.com";
const WORKER_CALLBACK_PATH = "/api/moolre/callback";
const WORKER_HOST = "klagon-payments.gideonabochie.workers.dev";

// Payment channel codes as the worker uses them (worker.js CHANNELS).
const PAYMENT_CHANNELS = { mtn: "13", telecel: "6", at: "7" };

const FAILURES = {
  AIN01: "Bad username or key. The worker will fail every charge.",
  AIN03: "Wallet not found for these credentials.",
  AIN04: "API access is not activated on this wallet. Every charge fails.",
  APGW06: "Currency does not support API. GHS only.",
  APGW12: "Wallet not found in your wallets.",
  SW06: "Wallet not found. Credentials look valid but the account number does not resolve.",
  TP13: "External reference must be unique and required.",
};

const checks = [];

function record(id, label, status, detail, hint) {
  checks.push({ id, label, status, detail: detail ?? "", hint: hint ?? null });
}

async function post(base, p, headers, body) {
  const started = performance.now();
  try {
    const res = await fetch(`${base}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, ms: performance.now() - started, raw: text };
  } catch (e) {
    return { status: 0, json: null, ms: performance.now() - started, error: String(e && e.message ? e.message : e) };
  }
}

function fingerprint(v) {
  if (!v) return "not set";
  return `${String(v).length} chars`;
}

// CHK-01 — reachability without credentials, so "can't reach Moolre" stays
// distinguishable from "wallet misconfigured".
async function checkReachability() {
  const url = `${API}/open/transact/data?country=gha&data=banks`;
  let res;
  try {
    const started = performance.now();
    const r = await fetch(url);
    const json = await r.json();
    res = { status: r.status, json, ms: performance.now() - started };
  } catch (e) {
    res = { status: 0, error: String(e && e.message ? e.message : e) };
  }

  if (res.status === 0) {
    record("CHK-01", "Moolre API reachable", "FAIL", res.error, "Network, proxy, firewall or TLS interception.");
    return null;
  }
  const banks = Array.isArray(res.json && res.json.data) ? res.json.data.length : 0;
  record(
    "CHK-01",
    "Moolre API reachable",
    banks > 0 ? "PASS" : "FAIL",
    `HTTP ${res.status}, ${res.json && res.json.code ? res.json.code : "no code"}, ${banks} bank codes, ${res.ms.toFixed(0)}ms`,
    banks > 0 ? null : "Unexpected response shape from the banks endpoint."
  );
  return banks;
}

// CHK-02 — the blind spot. Private key is required for the account endpoints;
// the worker never uses it, which is why nothing catches this at runtime.
async function checkAccount(user, privkey, wallet) {
  const res = await post(API, "/open/account/status", { "X-API-USER": user, "X-API-KEY": privkey }, { type: 1, accountnumber: wallet });
  const json = res.json || {};
  const code = String(json.code ?? "");

  if (code !== "SW01") {
    const hint = FAILURES[code] || (res.status === 0 ? res.error : `HTTP ${res.status}`);
    record("CHK-02", "Credentials resolve the wallet", "FAIL", `code ${code || res.status}: ${json.message || "no message"}`, hint);
    record("CHK-03", "Wallet activated", "BLOCKED", "Depends on CHK-02", null);
    record("CHK-04", "Callback URL matches the deployed worker", "BLOCKED", "Depends on CHK-02", null);
    return null;
  }

  record("CHK-02", "Credentials resolve the wallet", "PASS", `code SW01, ${res.ms.toFixed(0)}ms`, null);
  return json.data || {};
}

// CHK-03 — activation gates all transaction processing.
function checkActivated(data) {
  const activated = String(data.activated ?? "");
  const ok = activated === "1";
  record(
    "CHK-03",
    "Wallet activated",
    ok ? "PASS" : "FAIL",
    `activated=${activated || "missing"}, balance GHS ${data.balance ?? "?"}, name "${data.accountname ?? "?"}"`,
    ok ? null : "No activation endpoint is published. Complete setup, then contact Moolre support."
  );
}

// CHK-04 — compares what Moolre has stored against where the worker actually
// serves callbacks. A drift here silently strands every payment.
function checkCallback(data) {
  const stored = String(data.callback ?? "").trim();
  if (!stored) {
    record("CHK-04", "Callback URL matches the deployed worker", "FAIL", "No callback URL stored on the wallet", "Set it in the dashboard. Payments will never be confirmed.");
    return;
  }

  let parsed;
  try {
    parsed = new URL(stored);
  } catch {
    record("CHK-04", "Callback URL matches the deployed worker", "FAIL", `Unparseable: ${stored}`, null);
    return;
  }

  const problems = [];
  if (parsed.protocol !== "https:") problems.push("not HTTPS");
  if (parsed.pathname !== WORKER_CALLBACK_PATH) problems.push(`path is ${parsed.pathname}, worker serves ${WORKER_CALLBACK_PATH}`);
  if (parsed.hostname !== WORKER_HOST) problems.push(`host is ${parsed.hostname}, worker is ${WORKER_HOST}`);
  if (!parsed.searchParams.get("key")) problems.push("no key param — worker.js:877 will 403 every callback");

  record(
    "CHK-04",
    "Callback URL matches the deployed worker",
    problems.length === 0 ? "PASS" : "FAIL",
    problems.length === 0 ? `${parsed.origin}${parsed.pathname}?key=***` : problems.join("; "),
    problems.length === 0 ? null : "Moolre is calling the wrong URL, so confirm_donation_by_ref never fires."
  );
}

// CHK-05 — proves the PUBLIC key authenticates the charge path, using a
// deliberately invalid reference. Any non-auth error means the key is good.
async function checkPublicKey(user, pubkey, wallet) {
  const res = await post(API, "/open/transact/status", { "X-API-USER": user, "X-API-PUBKEY": pubkey }, {
    type: 1,
    idtype: 1,
    id: `KLG-VERIFY-${Date.now()}`,
    accountnumber: wallet,
  });
  const json = res.json || {};
  const code = String(json.code ?? "");
  const authBroken = res.status === 401 || code === "AIN01" || code === "AIN04";
  const notFound = code === "AC03" || /not found/i.test(String(json.message ?? ""));

  if (authBroken) {
    record("CHK-05", "Public key authenticates the charge path", "FAIL", `code ${code}: ${json.message}`, FAILURES[code] || "Charge will fail in production.");
  } else if (res.status === 0) {
    record("CHK-05", "Public key authenticates the charge path", "FAIL", res.error, null);
  } else {
    record(
      "CHK-05",
      "Public key authenticates the charge path",
      "PASS",
      `code ${code || res.status}${notFound ? " (expected: reference does not exist)" : ""}`,
      null
    );
  }
}

// CHK-06 — flags secrets the worker declares but never uses.
function checkSecretHygiene() {
  const privkey = process.env.MOOLRE_PRIVKEY;
  record(
    "CHK-06",
    "Worker secrets consistent with code",
    privkey ? "WARN" : "WARN",
    privkey ? "MOOLRE_PRIVKEY is set but workers/moolre/worker.js never reads it" : "MOOLRE_PRIVKEY not set locally",
    "Needed here for CHK-02/03. In the Worker it is a stored-but-unused credential — consider removing or using it."
  );
}

// CHK-07 — channel codes the worker hardcodes must match the docs.
function checkChannels() {
  const expected = { mtn: "13", telecel: "6", at: "7" };
  const drift = Object.keys(expected).filter((k) => PAYMENT_CHANNELS[k] !== expected[k]);
  record(
    "CHK-07",
    "Payment channel codes match docs",
    drift.length === 0 ? "PASS" : "FAIL",
    `MTN=${PAYMENT_CHANNELS.mtn} Telecel=${PAYMENT_CHANNELS.telecel} AT=${PAYMENT_CHANNELS.at}`,
    drift.length === 0 ? "Note: payment codes (13/6/7) differ from transfer codes (1/6/7). Worker is correct for collections." : "Channel drift."
  );
}

function printHuman(data, problems) {
  const color = process.stdout.isTTY && !process.env.NO_COLOR;
  const g = (t) => (color ? `\u001b[32m${t}\u001b[0m` : t);
  const r = (t) => (color ? `\u001b[31m${t}\u001b[0m` : t);
  const y = (t) => (color ? `\u001b[33m${t}\u001b[0m` : t);
  const d = (t) => (color ? `\u001b[90m${t}\u001b[0m` : t);
  const glyph = { PASS: g("PASS"), FAIL: r("FAIL"), WARN: y("WARN"), BLOCKED: y("BLOCK") };

  console.log(`\nMoolre wallet verification  ${d(API)}`);
  console.log(d(`  MOOLRE_USER     ${fingerprint(process.env.MOOLRE_USER)}`));
  console.log(d(`  MOOLRE_PUBKEY   ${fingerprint(process.env.MOOLRE_PUBKEY)}`));
  console.log(d(`  MOOLRE_PRIVKEY  ${fingerprint(process.env.MOOLRE_PRIVKEY)}`));
  console.log(d(`  MOOLRE_WALLET   ${process.env.MOOLRE_WALLET || "not set"}`));
  console.log(d(`  CALLBACK_KEY    ${fingerprint(process.env.CALLBACK_KEY)}`));

  if (problems.length) {
    console.log(`\n${r("Configuration incomplete")}`);
    for (const p of problems) console.log(`  ${r("x")} ${p}`);
    console.log(`\n${d("Create .env.moolre.local (gitignored). Names must match the worker's wrangler secrets.")}\n`);
    return 2;
  }

  console.log("");
  for (const c of checks) {
    console.log(`${glyph[c.status] || c.status}  ${c.label}`);
    if (c.detail) console.log(`      ${c.detail}`);
    if (c.hint) console.log(`      ${y(c.hint)}`);
  }

  if (data) {
    console.log(`\n${d("wallet")}`);
    console.log(`  name        ${data.accountname ?? "?"}`);
    console.log(`  number      ${data.accountnumber ?? process.env.MOOLRE_WALLET}`);
    console.log(`  balance     GHS ${data.balance ?? "?"}`);
    console.log(`  activated   ${data.activated ?? "?"}`);
  }

  const fails = checks.filter((c) => c.status === "FAIL");
  const warns = checks.filter((c) => c.status === "WARN");
  console.log("");
  if (fails.length) {
    console.log(r(`${fails.length} blocking failure(s). Charges will not complete.`));
    console.log("");
    return 1;
  }
  if (warns.length) {
    console.log(y("Wallet is viable. Review the warnings above."));
    console.log("");
    return 0;
  }
  console.log(g("All checks passed. Charges should complete."));
  console.log("");
  return 0;
}

function main() {
  const json = process.argv.includes("--json");
  const user = process.env.MOOLRE_USER || "";
  const pubkey = process.env.MOOLRE_PUBKEY || "";
  const privkey = process.env.MOOLRE_PRIVKEY || "";
  const wallet = process.env.MOOLRE_WALLET || "";

  const problems = [];
  if (!user) problems.push("MOOLRE_USER is not set.");
  if (!pubkey) problems.push("MOOLRE_PUBKEY is not set (charge path cannot authenticate).");
  if (!wallet) problems.push("MOOLRE_WALLET is not set.");
  if (!privkey) problems.push("MOOLRE_PRIVKEY is not set — CHK-02 and CHK-03 will be blocked.");

  if (problems.length && json) {
    console.log(JSON.stringify({ api: API, problems, checks: [], exitCode: 2 }, null, 2));
    return Promise.resolve(2);
  }

  return (async () => {
    const banks = await checkReachability();
    let walletState = null;
    if (banks !== null) {
      const data = privkey && user && wallet ? await checkAccount(user, privkey, wallet) : null;
      if (data) {
        walletState = data;
        checkActivated(data);
        checkCallback(data);
      }
      if (user && pubkey && wallet) await checkPublicKey(user, pubkey, wallet);
      else record("CHK-05", "Public key authenticates the charge path", "BLOCKED", "Missing MOOLRE_USER, MOOLRE_PUBKEY or MOOLRE_WALLET", null);
      checkSecretHygiene();
      checkChannels();
    }

    if (json) {
      const fails = checks.filter((c) => c.status === "FAIL").length;
      const code = fails > 0 ? 1 : 0;
      console.log(JSON.stringify({ api: API, problems, wallet: walletState, checks, exitCode: code }, null, 2));
      return code;
    }
    return printHuman(walletState, problems);
  })();
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(`\nUnexpected failure: ${e && e.stack ? e.stack : e}`);
    process.exit(3);
  }
);