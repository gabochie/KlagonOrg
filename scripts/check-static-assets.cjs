const base = process.argv[2] || "http://localhost:3100";

(async () => {
  const home = await fetch(`${base}/`);
  const html = await home.text();
  console.log(`GET /            -> ${home.status}  ${html.length} bytes  ct=${home.headers.get("content-type")}`);

  const srcs = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
  console.log(`script tags found: ${srcs.length}`);
  for (const s of srcs.slice(0, 4)) {
    const t0 = Date.now();
    try {
      const r = await fetch(base + s);
      const body = await r.text();
      console.log(`  ${s} -> ${r.status} ct=${r.headers.get("content-type")} len=${body.length} ${Date.now() - t0}ms`);
    } catch (e) {
      console.log(`  ${s} -> FAILED ${e.message} ${Date.now() - t0}ms`);
    }
  }

  const css = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
  for (const s of css.slice(0, 2)) {
    const r = await fetch(base + s);
    console.log(`  CSS ${s} -> ${r.status} ct=${r.headers.get("content-type")}`);
  }

  // A data-backed route: shell HTML only, content arrives client-side.
  const learn = await fetch(`${base}/learning`);
  const lh = await learn.text();
  console.log(`GET /learning    -> ${learn.status}  ${lh.length} bytes`);
  console.log(`  has __next_f push payload: ${lh.includes("self.__next_f")}`);
})();
