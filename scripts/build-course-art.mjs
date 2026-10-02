// build-course-art.mjs — authoring-time image pipeline for course covers.
//
// Two jobs, both deterministic and re-runnable:
//
//   1. Covers  — every master in content/learning/klagon-college/covers-src/<TOKEN>.<ext>
//                is resized/cropped to 16:9 WebP at card (600w) and hero (1200w)
//                widths, plus a 1200x630 JPEG for social previews. Masters are the
//                single source; derivatives are committed so the static export can
//                serve them (Next cannot optimize images under `output: export`).
//
//   2. Templates — six text-free branded backgrounds (five schools + a generic
//                fallback). Text-free on purpose: librsvg in CI has no guaranteed
//                fonts, and the course title is rendered in HTML over the image,
//                so nothing here depends on a font being installed.
//
// Usage: node scripts/build-course-art.mjs
import { mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename, extname } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MASTERS_DIR = join(ROOT, "content", "learning", "klagon-college", "covers-src");
const OUT_DIR = join(ROOT, "public", "brand", "learning");
const TEMPLATE_DIR = join(OUT_DIR, "templates");

const WIDE = { w: 1200, h: 675 }; // 16:9 hero / card-master
const CARD = { w: 600, h: 338 }; // 16:9 card
const OG = { w: 1200, h: 630 }; // social

const MASTER_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function kb(bytes) {
  return (bytes / 1024).toFixed(1) + " KB";
}

async function buildCover(token, masterPath) {
  const base = sharp(masterPath, { failOn: "none" }).rotate(); // honour EXIF orientation
  const hero = await base
    .clone()
    .resize(WIDE.w, WIDE.h, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toFile(join(OUT_DIR, `${token}-1200.webp`));
  const card = await base
    .clone()
    .resize(CARD.w, CARD.h, { fit: "cover", position: "attention" })
    .webp({ quality: 80 })
    .toFile(join(OUT_DIR, `${token}-600.webp`));
  const og = await base
    .clone()
    .resize(OG.w, OG.h, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT_DIR, `${token}-og.jpg`));
  console.log(
    `  cover ${token}: hero ${kb(hero.size)} · card ${kb(card.size)} · og ${kb(og.size)}`,
  );
}

// --- templates --------------------------------------------------------------
// Each is a 1200x675 SVG: a diagonal gradient plus soft geometric motifs. No
// text, so rendering never depends on an installed font.
const TEMPLATES = {
  ccc: { a: "#0F1B5C", b: "#1A2E8C", c: "#F59E0B" },
  sot: { a: "#1A2E8C", b: "#8B5CF6", c: "#F59E0B" },
  soe: { a: "#FF6B47", b: "#92400E", c: "#F59E0B" },
  sod: { a: "#10B981", b: "#1A2E8C", c: "#F4F6FB" },
  soa: { a: "#8B5CF6", b: "#FF6B47", c: "#F4F6FB" },
  generic: { a: "#0A1128", b: "#5B6878", c: "#F59E0B" },
};

function templateSvg({ a, b, c }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <radialGradient id="r" cx="0.78" cy="0.28" r="0.7">
      <stop offset="0" stop-color="${c}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <rect width="1200" height="675" fill="url(#r)"/>
  <circle cx="980" cy="150" r="230" fill="${c}" fill-opacity="0.10"/>
  <circle cx="1120" cy="560" r="300" fill="#ffffff" fill-opacity="0.05"/>
  <path d="M0 560 C 260 470, 520 640, 800 520 S 1200 420, 1200 470 L1200 675 L0 675 Z" fill="#ffffff" fill-opacity="0.06"/>
  <path d="M-40 130 C 220 60, 420 210, 700 120" stroke="${c}" stroke-opacity="0.22" stroke-width="3" fill="none"/>
</svg>`;
}

async function buildTemplates() {
  for (const [key, colors] of Object.entries(TEMPLATES)) {
    const svg = Buffer.from(templateSvg(colors));
    const hero = await sharp(svg)
      .resize(WIDE.w, WIDE.h)
      .webp({ quality: 80 })
      .toFile(join(TEMPLATE_DIR, `${key}-1200.webp`));
    const card = await sharp(svg)
      .resize(CARD.w, CARD.h)
      .webp({ quality: 78 })
      .toFile(join(TEMPLATE_DIR, `${key}-600.webp`));
    console.log(`  template ${key}: hero ${kb(hero.size)} · card ${kb(card.size)}`);
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TEMPLATE_DIR, { recursive: true });

  console.log("templates:");
  await buildTemplates();

  console.log("covers:");
  if (!existsSync(MASTERS_DIR)) {
    console.log("  (no covers-src directory — skipping; templates only)");
    return;
  }
  const masters = readdirSync(MASTERS_DIR).filter((f) => MASTER_EXT.has(extname(f).toLowerCase()));
  if (masters.length === 0) {
    console.log("  (no masters found — skipping)");
    return;
  }
  for (const file of masters) {
    const token = basename(file, extname(file));
    const full = join(MASTERS_DIR, file);
    if (!statSync(full).isFile()) continue;
    await buildCover(token, full);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});