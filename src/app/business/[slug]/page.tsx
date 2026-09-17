import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SponsorProfileContent } from "@/components/sponsor/SponsorProfileContent";
import { getSupabase } from "@/lib/supabase";

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("sponsors")
      .select("slug")
      .eq("status", "active");
    if (error || !data) return [];
    return data.map((s) => ({ slug: s.slug }));
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
      .select("name,tagline")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (!data) return { title: "Business — KlagonOrg" };
    return {
      title: `${data.name} — KLAGON Partner`,
      description: data.tagline ?? `${data.name} is a verified KLAGON business partner.`,
      alternates: { canonical: `/business/${slug}` },
    };
  } catch {
    return { title: "Business — KlagonOrg" };
  }
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <SponsorProfileContent slug={slug} />
      <Footer />
    </div>
  );
}