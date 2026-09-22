import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ThreadDetail } from "@/components/forum/ThreadDetail";
import { getSupabase } from "@/lib/supabase";

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from("forum_threads").select("id").eq("status", "visible");
    if (error || !data) return [];
    return data.map((t) => ({ threadId: t.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ threadId: string }>;
}): Promise<Metadata> {
  try {
    const { threadId } = await params;
    const sb = getSupabase();
    const { data } = await sb
      .from("forum_threads")
      .select("title")
      .eq("id", threadId)
      .eq("status", "visible")
      .maybeSingle();
    if (!data) return { title: "Forum thread — KLAGON.org" };
    return {
      title: `${data.title} — Community Forum | KLAGON.org`,
      description: `Join the discussion on ${data.title} in the Klagon community forum.`,
      alternates: { canonical: `/forum/t/${threadId}` },
    };
  } catch {
    return { title: "Forum thread — KLAGON.org" };
  }
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <ThreadDetail threadId={threadId} />
      <Footer />
    </div>
  );
}