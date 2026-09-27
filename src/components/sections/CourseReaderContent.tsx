import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { CourseViewer } from "@/components/learning/CourseViewer";

export interface CourseReaderResult {
  course: {
    id: string;
    title: string;
    category: string | null;
    icon: string | null;
    cover_url: string | null;
    description: string | null;
    published: boolean;
    prerequisite: { id: string; title: string } | null;
  } | null;
  lessons: {
    id: string;
    title: string;
    duration_min: number | null;
    content_url: string | null;
    content: string | null;
    sort_order: number | null;
  }[];
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * This component is a server component, so on a static export the course is
 * fetched once at build time and the result is baked into the HTML forever.
 * A transient Supabase failure used to be swallowed by a bare catch, which
 * shipped "This course is unavailable or unpublished." to every learner for
 * that course. Retry before giving up so a blip cannot become a dead page.
 */
async function fetchCourseAndLessons(id: string): Promise<CourseReaderResult> {
  const sb = getSupabase();
  const { data: c, error: courseError } = await sb
    .from("courses")
    .select("id,title,category,icon,cover_url,description,published,prerequisite_course_id")
    .eq("id", id)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!c || !c.published) return { course: null, lessons: [] };

  let prerequisite: { id: string; title: string } | null = null;
  if (c.prerequisite_course_id) {
    const { data: p } = await sb
      .from("courses")
      .select("id,title")
      .eq("id", c.prerequisite_course_id)
      .maybeSingle();
    if (p) prerequisite = { id: p.id, title: p.title };
  }

  const { data: l, error: lessonsError } = await sb
    .from("lessons")
    .select("id,title,duration_min,content_url,content,sort_order")
    .eq("course_id", id)
    .order("sort_order", { ascending: true });
  if (lessonsError) throw lessonsError;

  return {
    course: { ...c, prerequisite },
    lessons: (l ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      duration_min: row.duration_min,
      content_url: row.content_url,
      content: row.content,
      sort_order: row.sort_order,
    })),
  };
}

export async function getCourseAndLessons(id: string): Promise<CourseReaderResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fetchCourseAndLessons(id);
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        console.error(
          `[course-reader] ${id}: giving up after ${MAX_ATTEMPTS} attempts — this course will prerender as unavailable.`,
          err
        );
        return { course: null, lessons: [] };
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  return { course: null, lessons: [] };
}

export async function CourseReaderContent({ id, backHref = "/learning" }: { id: string; backHref?: string }) {
  const { course, lessons } = await getCourseAndLessons(id);

  if (!course) {
    return (
      <main className="w-full">
        <section className="bg-light py-20 px-4 text-center">
          <div className="text-lg font-extrabold text-navy mb-2">Course not found</div>
          <p className="text-sm text-gray mb-5">This course is unavailable or unpublished.</p>
          <Link
            href={backHref}
            className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
          >
            Back to Learning Hub
          </Link>
        </section>
      </main>
    );
  }

  return <CourseViewer key={course.id} course={course} lessons={lessons} />;
}