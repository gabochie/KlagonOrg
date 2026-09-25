// Builds an idempotent SQL migration for IT Tracks 0 + 1 (Phase 1).
// Mirrors scripts/build-courses-seed.cjs: lesson bodies become base64 blobs
// upserted against (course_id, sort_order). Additionally extracts each
// lesson's quiz block (#### Quiz / Final Quiz / Final Exam) into the
// quizzes / quiz_questions tables (see 20260927000000_it_quiz_schema.sql).
// FAILS LOUDLY (exit 1) on any parse mismatch — never emits partial content.
const fs = require("fs");
const path = require("path");

const COURSES_ROOT = path.resolve(
  "C:/Users/user/Desktop/Klagon College/IT course",
);
const OUT_FILE = path.resolve(
  "supabase/migrations/20260927000001_it_tracks_0_1_seed.sql",
);

// Order = prerequisite chain. badges key = lesson sort_order of the final lesson.
const COURSES = [
  {
    file: "04-Track0-Basic-Digital-Foundations.md",
    title: "Phone Ready - Start IT with Phone",
    icon: "📱",
    prereqTitle: null,
    badges: { 3: "Digital Ready - Klagon" },
  },
  {
    file: "01-HTML-Basic-Build-Your-First-Web-Page.md",
    title: "Build Your First Web Page",
    icon: "🌐",
    prereqTitle: "Phone Ready - Start IT with Phone",
    badges: { 3: "HTML Starter" },
  },
  {
    file: "02-HTML-Intermediate-Forms-Media-Layout.md",
    title: "Forms, Photos & Tables",
    icon: "📝",
    prereqTitle: "Build Your First Web Page",
    badges: { 3: "HTML Order-Taker" },
  },
  {
    file: "03-HTML-Advanced-Pro-Structure-Publish.md",
    title: "Publish Pro Site",
    icon: "🚀",
    prereqTitle: "Forms, Photos & Tables",
    badges: { 3: "HTML Builder - Klagon" },
  },
];

function esc(value) {
  return String(value).replace(/'/g, "''");
}

function fail(msg) {
  console.error(`[FATAL] ${msg}`);
  process.exit(1);
}

function estimateDuration(words) {
  const d = Math.round(words / 90) + 3;
  if (d < 8) return 8;
  if (d > 18) return 18;
  return d;
}

// Split raw file into lessons on "## Lesson N:" headings.
function splitLessons(raw, file) {
  const re = /^## Lesson (\d+):\s*(.*)$/gm;
  const heads = [];
  let m;
  while ((m = re.exec(raw)) !== null) {
    heads.push({ num: Number(m[1]), heading: m[2].trim(), index: m.index });
  }
  if (heads.length !== 4) fail(`${file}: expected 4 lessons, found ${heads.length}`);
  heads.forEach((h, i) => {
    if (h.num !== i + 1) fail(`${file}: lesson numbers not 1..4 (got ${h.num} at position ${i})`);
  });
  return heads.map((h, i) => {
    const start = raw.indexOf("\n", h.index) + 1;
    const end = i + 1 < heads.length ? heads[i + 1].index : raw.length;
    return { num: h.num, heading: h.heading, chunk: raw.slice(start, end) };
  });
}

// Split a lesson chunk into body markdown + parsed quiz.
function splitQuiz(chunk, file, lessonNum) {
  const marker = chunk.match(/^#### (Final Exam|Final Quiz|Quiz)\b([^\n]*)$/m);
  if (!marker) fail(`${file} lesson ${lessonNum}: no #### Quiz block found`);
  const isFinal = marker[1] !== "Quiz";
  const body = chunk.slice(0, marker.index).replace(/\s+$/, "");
  const quizText = chunk.slice(marker.index);

  const qre = /^(\d+)\.\s*(Recall|Fix-it):\s*(.+)$/gm;
  const questions = [];
  let qm;
  while ((qm = qre.exec(quizText)) !== null) {
    questions.push({ num: Number(qm[1]), kind: qm[2], rest: qm[3].trim() });
  }
  if (questions.length < 4) {
    fail(`${file} lesson ${lessonNum}: expected >=4 questions, found ${questions.length}`);
  }
  questions.forEach((q, i) => {
    if (q.num !== i + 1) fail(`${file} lesson ${lessonNum}: question numbers not sequential`);
  });

  const parsed = questions.map((q) => {
    const om = q.rest.match(/^(.*?)\s+a\)\s*(.*?)\s+b\)\s*(.*?)\s+c\)\s*(.*?)\s*$/);
    if (!om) fail(`${file} lesson ${lessonNum} Q${q.num}: options not in "a) .. b) .. c) .." shape`);
    return { kind: q.kind === "Recall" ? "recall" : "fix-it", stem: om[1].trim(), options: [om[2].trim(), om[3].trim(), om[4].trim()] };
  });

  const ansLine = quizText.match(/^Answers:\s*(.+)$/m);
  if (!ansLine) fail(`${file} lesson ${lessonNum}: no Answers: line found`);
  const answers = ansLine[1].split(",").map((s) => s.trim()).map((s) => {
    const am = s.match(/^(\d+)\s*-\s*([abc])$/i);
    if (!am) fail(`${file} lesson ${lessonNum}: unparseable answer token "${s}"`);
    return { num: Number(am[1]), letter: am[2].toLowerCase() };
  });
  if (answers.length !== questions.length) {
    fail(`${file} lesson ${lessonNum}: ${questions.length} questions but ${answers.length} answers`);
  }
  answers.forEach((a, i) => {
    if (a.num !== i + 1) fail(`${file} lesson ${lessonNum}: answer numbers not sequential`);
  });

  // Anything after the Answers line must be empty, a horizontal rule,
  // or the known admin note.
  const after = quizText
    .slice(ansLine.index + ansLine[0].length)
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s !== "" && !/^(-{3,}|\*{3,}|_{3,})$/.test(s))
    .join("\n");
  if (after !== "" && !/HOW TO UPLOAD TO KLAGON/i.test(after)) {
    fail(`${file} lesson ${lessonNum}: unexpected trailing content after Answers: line`);
  }

  let passScore;
  const passM = marker[0].match(/pass\s+(\d+)\s*\/\s*(\d+)/i);
  if (passM) {
    if (Number(passM[2]) !== questions.length) {
      fail(`${file} lesson ${lessonNum}: stated pass total ${passM[2]} != ${questions.length} questions`);
    }
    passScore = Number(passM[1]);
  } else {
    passScore = questions.length - 1;
  }

  return {
    body,
    isFinal,
    questions: parsed.map((q, i) => ({ ...q, correctIndex: { a: 0, b: 1, c: 2 }[answers[i].letter] })),
    passScore,
  };
}

const blocks = [];
blocks.push("-- Auto-generated by scripts/build-it-courses-seed.cjs. Do not edit by hand.");
blocks.push("-- IT Tracks 0 + 1 (Phase 1): 4 courses, 16 lessons, quizzes extracted to quiz tables.");
blocks.push("-- Lesson bodies EXCLUDE quiz blocks (rendered by the quiz UI). Re-runnable via upserts.");
blocks.push("");

let totalLessons = 0;
let totalQuestions = 0;

for (const course of COURSES) {
  const raw = fs.readFileSync(path.join(COURSES_ROOT, course.file), "utf8").replace(/^\uFEFF/, "");
  const tagM = raw.match(/^Tagline:\s*(.+)$/m);
  if (!tagM) fail(`${course.file}: no Tagline: line found`);
  const description = tagM[1].trim();
  const t = esc(course.title);

  blocks.push(`-- ================= ${course.title} =================`);
  blocks.push(`insert into public.courses (title, category, icon, description, published)`);
  blocks.push(`select '${t}', 'Future Skills', '${course.icon}', '${esc(description)}', true`);
  blocks.push(`where not exists (select 1 from public.courses where title = '${t}');`);
  blocks.push("");
  if (course.prereqTitle) {
    const p = esc(course.prereqTitle);
    blocks.push(`update public.courses c set prerequisite_course_id = p.id`);
    blocks.push(`from public.courses p`);
    blocks.push(`where c.title = '${t}' and p.title = '${p}'`);
    blocks.push(`  and c.prerequisite_course_id is distinct from p.id;`);
    blocks.push("");
  }

  const lessons = splitLessons(raw, course.file);
  lessons.forEach((lesson, i) => {
    const { body, questions, passScore } = splitQuiz(lesson.chunk, course.file, lesson.num);
    let title = lesson.heading.replace(/\s*-\s*\d+\s*min\s*$/, "").trim();
    if (!title) fail(`${course.file} lesson ${lesson.num}: empty title`);
    const durM = lesson.heading.match(/(\d+)\s*min\s*$/);
    const duration = durM
      ? Math.min(18, Math.max(8, Number(durM[1])))
      : estimateDuration(body.split(/\s+/).length);
    const b64 = Buffer.from(body, "utf8").toString("base64");

    blocks.push(`-- ${course.title} :: lesson ${i} — ${title} (${duration} min, ${questions.length} quiz Qs, pass ${passScore})`);
    blocks.push(`insert into public.lessons (course_id, title, duration_min, content, sort_order)`);
    blocks.push(`select c.id, '${esc(title)}', ${duration}, convert_from(decode('${b64}','base64'),'utf8'), ${i}`);
    blocks.push(`from public.courses c where c.title = '${t}'`);
    blocks.push(`on conflict (course_id, sort_order) do update`);
    blocks.push(`set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;`);
    blocks.push("");

    const badge = course.badges[i] ? `'${esc(course.badges[i])}'` : "null";
    const lessonScope = [
      `from public.lessons l join public.courses c on c.id = l.course_id`,
      `where c.title = '${t}' and l.sort_order = ${i}`,
    ];
    blocks.push(`insert into public.quizzes (lesson_id, pass_score, badge_name)`);
    blocks.push(`select l.id, ${passScore}, ${badge}`);
    blocks.push(...lessonScope);
    blocks.push(`on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;`);
    blocks.push("");
    blocks.push(`delete from public.quiz_questions where quiz_id in (`);
    blocks.push(`  select q.id from public.quizzes q`);
    blocks.push(`  join public.lessons l on l.id = q.lesson_id`);
    blocks.push(`  join public.courses c on c.id = l.course_id`);
    blocks.push(`  where c.title = '${t}' and l.sort_order = ${i}`);
    blocks.push(`);`);
    questions.forEach((q, qi) => {
      blocks.push(`insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)`);
      blocks.push(`select q.id, ${qi}, '${q.kind}', '${esc(q.stem)}', '${esc(JSON.stringify(q.options))}'::jsonb, ${q.correctIndex}`);
      blocks.push(...lessonScope.map((s, si) => (si === 0 ? s.replace("from public.lessons l", "from public.quizzes q join public.lessons l on l.id = q.lesson_id") : s)));
      blocks.push("");
    });

    totalLessons += 1;
    totalQuestions += questions.length;
  });
}

fs.writeFileSync(OUT_FILE, blocks.join("\n") + "\n", "utf8");
console.log(`Wrote ${OUT_FILE}`);
console.log(`Courses: ${COURSES.length}, Lessons: ${totalLessons}, Quiz questions: ${totalQuestions}`);
if (COURSES.length !== 4 || totalLessons !== 16 || totalQuestions !== 65) {
  fail(`count mismatch: expected 4 courses / 16 lessons / 65 questions`);
}
console.log("Counts verified: 4 courses / 16 lessons / 65 questions. OK.");
