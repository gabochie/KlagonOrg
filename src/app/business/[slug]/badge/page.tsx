import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BadgePageContent } from "@/components/sponsor/BadgePageContent";
import { getSupabase } from "@/lib/supabase";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const sb = getSupabase();
    const { data } = await sb.from("sponsors").select("slug").eq("status", "active");
    return (data ?? []).map((s) => ({ slug: s.slug }));
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