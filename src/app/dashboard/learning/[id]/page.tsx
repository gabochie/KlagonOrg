import { CourseReaderContent } from "@/components/sections/CourseReaderContent";
import { COURSES } from "@/lib/constants";
import courseIds from "@/data/course-ids.json";
import { getSupabase } from "@/lib/supabase";
import { resolveStaticKeys } from "@/lib/staticParams";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await resolveStaticKeys(
    "/dashboard/learning/[id]",
    async () => {
      const sb = getSupabase();
      const { data, error } = await sb.from("courses").select("id").eq("published", true);
      if (error) throw error;
      return (data ?? []).map((c) => c.id as string);
    },
    [...courseIds, ...COURSES.map((c) => c.id)]
  );
  return ids.map((id) => ({ id }));
}

export default async function DashboardCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseReaderContent id={id} backHref="/dashboard/learning" />;
}