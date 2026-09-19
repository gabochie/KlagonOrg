import type { Metadata } from "next";
import { BusinessCardContent } from "@/components/sponsor/BusinessCardContent";
import { getSupabase } from "@/lib/supabase";

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from("business_cards").select("slug");
    if (error || !data) return [];
    return data.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
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