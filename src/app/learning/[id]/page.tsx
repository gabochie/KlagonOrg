import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CourseReaderContent } from "@/components/sections/CourseReaderContent";
import { COURSES } from "@/lib/constants";
import courseIds from "@/data/course-ids.json";
import { getSupabase } from "@/lib/supabase";
import { resolveStaticKeys } from "@/lib/staticParams";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await resolveStaticKeys(
    "/learning/[id]",
    async () => {
      const sb = getSupabase();
      const { data, error } = await sb.from("courses").select("id").eq("published", true);
      if (error) throw error;
      return (data ?? []).map((c) => c.id as string);
    },
    // Real published course ids, not the COURSES placeholders. Falling back to
    // placeholders would silently drop every real course page from the export
    // while still producing a green build. COURSES ids are appended as a last
    // resort so params are never empty, which would be fatal for output: export.
    [...courseIds, ...COURSES.map((c) => c.id)]
  );
  return ids.map((id) => ({ id }));
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
      description: `Take the ${data.title} course free with KLAGON.org.`,
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
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <CourseReaderContent id={id} />
      <Footer />
    </div>
  );
}