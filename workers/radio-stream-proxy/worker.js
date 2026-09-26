// Klagon Radio stream proxy — HTTPS upgrade for free Caster.fm HTTP mount.
// Why: Caster free plan serves http:// only (no SSL). klagon.org is HTTPS,
// so browsers block raw http streams as mixed-content ("not private").
// This Worker fetches the HTTP mount server-side and re-serves it over HTTPS.
//
// Routes:
//   GET /stream  -> live audio proxy (follow redirects, stream body through)
//   GET /health  -> { ok: true, upstream }
//   GET /        -> usage hint
//
// Deploy: cd workers/radio-stream-proxy && wrangler deploy
// Custom domain (recommended): radio.klagon.org -> this worker (Workers Routes).
// No secrets required. UPSTREAM is public listener mount, NOT source password.

const UPSTREAM = "http://morcast.caster.fm:10560/4st2F";

function corsHeaders(origin) {
  const allowed =
    origin === "https://klagon.org" ||
    origin === "https://www.klagon.org" ||
    (typeof origin === "string" && origin.endsWith(".klagon-org.pages.dev")) ||
    (typeof origin === "string" && origin.endsWith(".klagon.org"));
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Icy-MetaData",
    "Access-Control-Expose-Headers": "Content-Type, icy-name, icy-genre, icy-br",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, upstream: UPSTREAM }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    if (url.pathname === "/" ) {
      return new Response("Klagon Radio proxy. Use GET /stream for audio.", {
        headers: { "Content-Type": "text/plain", ...corsHeaders(origin) },
      });
    }

    if (url.pathname === "/stream" && request.method === "GET") {
      const headers = new Headers();
      const range = request.headers.get("Range");
      if (range) headers.set("Range", range);
      headers.set("Icy-MetaData", "1");
      headers.set("User-Agent", "KlagonRadioProxy/1.0 (+https://klagon.org/radio)");

      let upstream;
      try {
        upstream = await fetch(UPSTREAM, { headers, redirect: "follow" });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "upstream-unreachable", detail: String(err).slice(0, 200) }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
        );
      }

      const out = new Headers();
      for (const k of ["content-type", "icy-name", "icy-genre", "icy-br", "icy-url", "accept-ranges", "content-range"]) {
        const v = upstream.headers.get(k);
        if (v) out.set(k === "content-type" ? "Content-Type" : k, v);
      }
      if (!out.has("Content-Type")) out.set("Content-Type", "audio/mpeg");
      out.set("Cache-Control", "no-store");
      for (const [k, v] of Object.entries(corsHeaders(origin))) out.set(k, v);

      return new Response(upstream.body, { status: upstream.status, headers: out });
    }

    return new Response(JSON.stringify({ error: "not-found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  },
};
