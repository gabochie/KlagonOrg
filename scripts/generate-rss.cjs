/* Generates public/rss.xml (blog feed) so it ships in the static export.
   Run via npm run build:gen:rss (executed before `next build`). */
const fs = require("node:fs");
const path = require("node:path");

const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const OUT = path.join(__dirname, "..", "public", "rss.xml");
const BASE = "https://klagon.org";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function buildRss() {
  if (!fs.existsSync(BLOG_DIR)) return;
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const items = files
    .map((f) => {
      try {
        const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf8");
        const match = raw.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return null;
        const front = match[1];
        const get = (k) => {
          const m = front.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
          return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
        };
        const title = get("title");
        const slug = get("slug") || path.basename(f, ".md");
        const description = get("description");
        const date = get("date");
        const category = get("category");
        return {
          title,
          slug,
          description,
          iso: date,
          category,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((p) => p && p.title && p.slug)
    .sort((a, b) => {
      const da = new Date(a.iso).getTime() || 0;
      const db = new Date(b.iso).getTime() || 0;
      if (db !== da) return db - da;
      return String(a.slug).localeCompare(String(b.slug));
    })
    .slice(0, 20);

  const itemsXml = items
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${BASE}/blog/${esc(p.slug)}/</link>
      <guid isPermaLink="true">${BASE}/blog/${esc(p.slug)}/</guid>
      <pubDate>${safeDate(p.iso)}</pubDate>
      <description>${esc(p.description)}</description>
      <category>${esc(p.category)}</category>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>KlagonOrg Blog</title>
    <link>${BASE}/blog</link>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Mastery of change in the digital age — practical guides for Ghana's youth on lifelong learning, digital transformation, thinking skills, building visions, and making things happen.</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, xml, "utf8");
  console.log(`rss.xml written with ${items.length} items`);
}

buildRss();