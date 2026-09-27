const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

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

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const COURSE_ID = "cbdfface-25dc-4756-a84e-eaec6dfc570e";

(async () => {
  // 1. exactly what generateStaticParams does
  const ids = await sb.from("courses").select("id").eq("published", true);
  console.log(`[1] generateStaticParams query -> error=${ids.error ? ids.error.message : "none"} rows=${ids.data?.length}`);

  // 2. exactly what getCourseAndLessons does for the course row
  const c = await sb
    .from("courses")
    .select("id,title,category,icon,cover_url,description,published,prerequisite_course_id")
    .eq("id", COURSE_ID)
    .maybeSingle();
  console.log(`[2] course select -> error=${c.error ? `${c.error.code}: ${c.error.message}` : "none"}`);
  console.log(`    data=${c.data ? `title="${c.data.title}" published=${c.data.published}` : "null"}`);

  // 3. exactly what getCourseAndLessons does for lessons
  const l = await sb
    .from("lessons")
    .select("id,title,duration_min,content_url,content,sort_order")
    .eq("course_id", COURSE_ID)
    .order("sort_order", { ascending: true });
  console.log(`[3] lessons select -> error=${l.error ? `${l.error.code}: ${l.error.message}` : "none"} rows=${l.data?.length}`);
  for (const row of l.data ?? []) console.log(`      - ${row.title}`);
})();
