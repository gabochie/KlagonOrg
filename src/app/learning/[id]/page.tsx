import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CourseViewer } from "@/components/learning/CourseViewer";
import { getSupabase } from "@/lib/supabase";

export async function generateStaticParams() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from("courses").select("id").eq("published", true);
    if (error || !data) return [];
    return data.map((c) => ({ id: c.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const sb = getSupabase();
    const { data } = await sb.from("courses").select("title").eq("id", id).maybeSingle();
    if (!data) return { title: "Course" };
    return {
      title: data.title,
      description: `Take the ${data.title} course free with KlagonOrg.`,
      alternates: { canonical: `/learning/${id}` },
    };
  } catch {
    return { title: "Course" };
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let course = null;
  let lessons: {
    id: string;
    title: string;
    duration_min: number | null;
    content_url: string | null;
    content: string | null;
    sort_order: number | null;
  }[] = [];

  try {
    const sb = getSupabase();
    const { data: c } = await sb
      .from("courses")
      .select("id,title,category,icon,description,published")
      .eq("id", id)
      .maybeSingle();
    if (c && c.published) {
      course = c;
      const { data: l } = await sb
        .from("lessons")
        .select("id,title,duration_min,content_url,content,sort_order")
        .eq("course_id", id)
        .order("sort_order", { ascending: true });
      lessons = (l ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        duration_min: row.duration_min,
        content_url: row.content_url,
        content: row.content,
        sort_order: row.sort_order,
      }));
    }
  } catch {
    course = null;
  }

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      {course ? (
        <CourseViewer course={course} lessons={lessons} />
      ) : (
        <section className="bg-light py-20 px-4 text-center">
          <div className="text-lg font-extrabold text-navy mb-2">Course not found</div>
          <p className="text-sm text-gray mb-5">
            This course is unavailable or unpublished.
          </p>
          <Link
            href="/learning"
            className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
          >
            Back to Learning Hub
          </Link>
        </section>
      )}
      </main>
      <Footer />
    </div>
  );
}