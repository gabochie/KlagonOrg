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

export default async function DashboardCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseReaderContent id={id} backHref="/dashboard/learning" />;
}