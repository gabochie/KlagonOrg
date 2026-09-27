import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PostDetailContent } from "@/components/posts/PostDetailContent";
import { getSupabase } from "@/lib/supabase";
import { resolveStaticKeys } from "@/lib/staticParams";
import NEWS_IDS from "@/data/news-ids.json";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await resolveStaticKeys(
    "/news/[id]",
    async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("posts")
        .select("id")
        .eq("status", "approved")
        .order("published_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((p) => p.id as string);
    },
    NEWS_IDS as string[]
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
    const { data } = await sb
      .from("posts")
      .select("title,excerpt,cover_url")
      .eq("id", id)
      .maybeSingle();
    if (!data) return { title: "Post not found — KLAGON.org" };
    return {
      title: `${data.title} — Klagon Community`,
      description: data.excerpt ?? "A community post from the Klagon hyperlocal portal.",
      alternates: { canonical: `/news/${id}` },
      openGraph: {
        title: data.title,
        description: data.excerpt ?? undefined,
        url: `https://klagon.org/news/${id}`,
        siteName: "KLAGON.org",
        type: "article",
        locale: "en_GH",
        images: [{ url: data.cover_url ?? "/brand/og-banner.png" }],
      },
      twitter: {
        card: "summary_large_image",
        title: data.title,
        description: data.excerpt ?? undefined,
        images: [data.cover_url ?? "/brand/og-banner.png"],
      },
    };
  } catch {
    return { title: "Community post — KLAGON.org" };
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <PostDetailContent id={id} />
      </main>
      <Footer />
    </div>
  );
}
