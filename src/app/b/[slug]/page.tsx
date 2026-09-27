import type { Metadata } from "next";
import { BusinessCardContent } from "@/components/sponsor/BusinessCardContent";
import { getSupabase } from "@/lib/supabase";
import { resolveStaticKeys } from "@/lib/staticParams";
import BUSINESS_CARD_SLUGS from "@/data/business-card-slugs.json";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await resolveStaticKeys(
    "/b/[slug]",
    async () => {
      const sb = getSupabase();
      const { data, error } = await sb.from("business_cards").select("slug");
      if (error) throw error;
      return (data ?? []).map((c) => c.slug as string);
    },
    BUSINESS_CARD_SLUGS as string[]
  );
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const sb = getSupabase();
    const { data } = await sb
      .from("business_cards")
      .select("sponsor_id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return { title: "Business Card — KLAGON.org" };
    const { data: s } = await sb
      .from("sponsors")
      .select("name,tagline")
      .eq("id", data.sponsor_id)
      .eq("status", "active")
      .maybeSingle();
    if (!s) return { title: "Business Card — KLAGON.org" };
    return {
      title: `${s.name} — Digital Business Card`,
      description: `Contact ${s.name} in one tap. ${s.tagline ?? ""}`.trim(),
      alternates: { canonical: `/b/${slug}` },
    };
  } catch {
    return { title: "Business Card — KLAGON.org" };
  }
}

export default async function BusinessCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="w-full overflow-hidden">
      <BusinessCardContent slug={slug} />
    </div>
  );
}