/**
 * Post-build gate: refuse to ship an export that references the image optimizer.
 *
 * klagon.org is `output: "export"`. A static export has no `/_next/image`
 * route, so `next/image` does not degrade gracefully — it silently emits a
 * URL that 404s at runtime and the image never decodes.
 *
 * That is not hypothetical. `InstallPrompt.tsx` used `next/image` for its icon
 * and shipped a permanently broken image: the markup pointed at
 * `/_next/image/?url=%2Ficon-192.png&w=96&q=75`, which returned 404 on
 * production and rendered with `naturalWidth === 0`. Nothing failed. Lint
 * passed, typecheck passed, the build passed, and the e2e suite passed,
 * because no test loaded the prompt (`beforeinstallprompt` never fires in
 * headless Chromium) and no test asserted on the icon.
 *
 * Two independent checks, because the bug hides in two different places:
 *
 *   1. Source: any `from "next/image"` under src/. The rule is absolute in
 *      export mode, so this is the check that actually prevents it.
 *   2. Export: a literal optimizer URL in any emitted HTML. Client-only
 *      components render as `null` on the server, so their URL never reaches
 *      the HTML and only check 1 can see them. This catches the HTML case,
 *      where a mistake has already been baked into the artifact.
 *
 * Plain `<img>` is the correct pattern here. The cost is a missed
 * `no-img-element` lint warning, which is the right trade for an image that
 * actually loads.
 *
 * If the site ever moves off static export to a real server with an optimizer,
 * delete this script and the `verify:static-images` step in package.json.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "out");
const NEXT_CONFIG = path.join(ROOT, "next.config.ts");

const IMPORT_RE = /from\s+["']next\/image["']/;
const OPTIMIZER_URL_RE = /\/_next\/image\/?\?url=/;
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(p, exts));
    } else if (exts.has(path.extname(entry.name))) {
      found.push(p);
    }
  }
  return found;
}

// The whole script is meaningless unless the site really is a static export,
// so read the config rather than trusting this file's own assumptions.
function isStaticExport() {
  try {
    return /output\s*:\s*["']export["']/.test(fs.readFileSync(NEXT_CONFIG, "utf8"));
  } catch {
    return false;
  }
}

if (!isStaticExport()) {
  console.log(
    "[verify-static-images] next.config.ts is not output: \"export\" — the image\n" +
      "[verify-static-images] optimizer exists, so next/image is allowed. Skipping."
  );
  process.exit(0);
}

const sources = walk(SRC, SOURCE_EXT);
const sourceOffenders = sources.filter((f) =>
  IMPORT_RE.test(fs.readFileSync(f, "utf8"))
);

const html = walk(OUT, new Set([".html"]));
const exportOffenders = html.filter((f) =>
  OPTIMIZER_URL_RE.test(fs.readFileSync(f, "utf8"))
);

console.log(
  `[verify-static-images] scanned ${sources.length} source file(s) and ${html.length} exported page(s).`
);

if (sourceOffenders.length === 0 && exportOffenders.length === 0) {
  console.log("[verify-static-images] ok — no image optimizer references.");
  process.exit(0);
}

if (sourceOffenders.length > 0) {
  console.error(
    `[verify-static-images] ${sourceOffenders.length} file(s) import next/image, which does not work\n` +
      "[verify-static-images] under output: \"export\":"
  );
  for (const f of sourceOffenders) {
    console.error(`  ${path.relative(ROOT, f)}`);
  }
}

if (exportOffenders.length > 0) {
  console.error(
    `[verify-static-images] ${exportOffenders.length} exported page(s) contain a /_next/image URL that will 404:`
  );
  for (const f of exportOffenders.slice(0, 20)) {
    console.error(`  ${path.relative(OUT, f)}`);
  }
  if (exportOffenders.length > 20) {
    console.error(`  ...and ${exportOffenders.length - 20} more`);
  }
}

console.error(
  "\n[verify-static-images] Refusing to ship. Replace next/image with a plain <img>\n" +
    "[verify-static-images] carrying explicit width/height, matching\n" +
    "[verify-static-images] src/components/radio/SponsorStrip.tsx and\n" +
    "[verify-static-images] src/components/sections/SponsoredDirectoryBlock.tsx."
);
process.exit(1);