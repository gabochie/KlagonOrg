const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const env = {};
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, f), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const H = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

const get = async (p) => {
  const r = await fetch(base + p, { headers: H });
  const j = await r.json();
  return { status: r.status, body: j };
};

(async () => {
  const course = await get("/rest/v1/courses?select=*&title=eq.Phone Ready - Start IT with Phone&limit=1");
  const c = Array.isArray(course.body) ? course.body[0] : null;
  if (!c) {
    console.log("course not found:", JSON.stringify(course.body).slice(0, 200));
    return;
  }
  console.log("course columns:", Object.keys(c).join(", "));
  console.log(`course id=${c.id}  slug=${c.slug}`);

  const probe = await get("/rest/v1/lessons?select=*&limit=1");
  if (Array.isArray(probe.body) && probe.body[0]) {
    console.log("lessons columns:", Object.keys(probe.body[0]).join(", "));
    console.log("sample lesson:", JSON.stringify(probe.body[0]).slice(0, 400));
  } else {
    console.log("lessons probe:", probe.status, JSON.stringify(probe.body).slice(0, 200));
  }

  const lessons = await get(
    `/rest/v1/lessons?select=id,title,sort_order&course_id=eq.${c.id}&order=sort_order.asc&limit=50`,
  );
  if (Array.isArray(lessons.body)) {
    console.log(`\nlessons for this course: ${lessons.body.length}`);
    for (const l of lessons.body) {
      console.log(`  order=${l.position} ${l.title ?? l.name ?? "(untitled)"}`);
    }
  } else {
    console.log("lessons for course:", lessons.status, JSON.stringify(lessons.body).slice(0, 300));
  }
})();
