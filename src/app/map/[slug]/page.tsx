import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapPlaceContent } from "@/components/map/MapPlaceContent";
import { getMapPages } from "@/lib/map/data";
import { entityTypeLabel } from "@/lib/map/layers";

export const dynamicParams = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const { slugById } = await getMapPages();
  return [...slugById.values()].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { bySlug } = await getMapPages();
  const p = bySlug.get(slug);
  if (!p) return { title: "Place — Klagon Knowledge Map | KLAGON.org" };
  const kind = entityTypeLabel(p.entity_type);
  const description =
    p.description ??
    `${p.name} — ${p.category ?? kind}${p.community_area ? ` in ${p.community_area}` : ""}. Find it on the Klagon community map.`;
  return {
    title: `${p.name} — ${p.category ?? kind} in Klagon | KLAGON.org`,
    description,
    alternates: { canonical: `/map/${slug}` },
  };
}

export default async function MapPointPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { bySlug } = await getMapPages();
  const point = bySlug.get(slug);
  if (!point) notFound();
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <MapPlaceContent point={point} slug={slug} />
      <Footer />
    </div>
  );
}