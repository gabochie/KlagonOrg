import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BadgePageContent } from "@/components/sponsor/BadgePageContent";
import { getSupabase } from "@/lib/supabase";
import { resolveStaticKeys } from "@/lib/staticParams";
import SPONSOR_SLUGS from "@/data/sponsor-slugs.json";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await resolveStaticKeys(
    "/business/[slug]/badge",
    async () => {
      const sb = getSupabase();
      const { data, error } = await sb.from("sponsors").select("slug").eq("status", "active");
      if (error) throw error;
      return (data ?? []).map((s) => s.slug as string);
    },
    SPONSOR_SLUGS as string[]
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
      .from("sponsors")
      .select("name")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (!data) return { title: "Badge — KLAGON.org" };
    return {
      title: `${data.name} — KLAGON Badge & Certificate`,
      description: `Download ${data.name}'s KLAGON Verified Business badge, QR code, embed snippet, and certificate.`,
      alternates: { canonical: `/business/${slug}/badge` },
    };
  } catch {
    return { title: "Badge — KLAGON.org" };
  }
}

export default async function BadgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <BadgePageContent slug={slug} />
      <Footer />
    </div>
  );
}