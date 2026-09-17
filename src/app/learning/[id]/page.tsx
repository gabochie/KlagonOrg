import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CourseReaderContent } from "@/components/sections/CourseReaderContent";
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
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <CourseReaderContent id={id} />
      <Footer />
    </div>
  );
}