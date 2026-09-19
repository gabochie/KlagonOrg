import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DirectoryProfileContent } from "@/components/sections/DirectoryProfileContent";
import type { DirectorySnapshot, DirectoryBusiness } from "@/lib/directory";
import snapshotData from "@/data/business-directory.json";

export const dynamicParams = false;

const snapshot = snapshotData as unknown as DirectorySnapshot;
const bySlug = new Map<string, DirectoryBusiness>(snapshot.businesses.map((b) => [b.slug, b]));

function rank(a: DirectoryBusiness, b: DirectoryBusiness) {
  return (
    Number(b.verified) - Number(a.verified) ||
    (b.rating ?? 0) - (a.rating ?? 0) ||
    a.name.localeCompare(b.name)
  );
}

function relatedFor(b: DirectoryBusiness): DirectoryBusiness[] {
  return snapshot.businesses
    .filter((r) => r.category === b.category && r.slug !== b.slug)
    .sort(rank)
    .slice(0, 6);
}

export function generateStaticParams() {
  return snapshot.businesses.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = bySlug.get(slug);
  if (!b) return { title: "Business — KLAGON.org" };
  const description = `${b.name} — ${b.title || b.category} in ${b.area}. Find contact details and directions on the KLAGON business directory.`;
  return {
    title: `${b.name} — ${b.category} in Klagon | KLAGON.org`,
    description,
    alternates: { canonical: `/directory/${slug}` },
  };
}

export default async function DirectoryProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = bySlug.get(slug);
  if (!business) notFound();
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <DirectoryProfileContent business={business} related={relatedFor(business)} />
      <Footer />
    </div>
  );
}
