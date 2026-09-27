import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BusinessDirectoryContent } from "@/components/sections/BusinessDirectoryContent";
import type { DirectorySnapshot } from "@/lib/directory";
import { fetchPublicSponsors, parseContact } from "@/lib/sponsors";
import type { SponsoredPlacement } from "@/lib/ads";
import snapshotData from "@/data/business-directory.json";

export const metadata: Metadata = {
  title: "Business Directory — Klagon, Lashibi & Tema | KLAGON.org",
  description:
    "Find 740 businesses in Klagon, Lashibi and Tema — shops, clinics, schools, pharmacies and services. Search by name or category, get directions, and claim your free listing.",
  alternates: { canonical: "/business" },
};

export default async function BusinessPage() {
  const snapshot = snapshotData as unknown as DirectorySnapshot;

  // Sponsors are the buyers of directory placement. They live in their own
  // curated table with no slug overlap with the 740 auto-imported listings, so
  // they are projected into a separate labelled block rather than merged into
  // the organic results. Fails closed to no placements if Supabase is
  // unreachable at build time.
  const sponsors = await fetchPublicSponsors();
  const sponsored: SponsoredPlacement[] = sponsors.map((s) => {
    const contact = parseContact(s.contact);
    return {
      slug: s.slug,
      name: s.name,
      tier: s.tier,
      tagline: s.tagline ?? null,
      logoUrl: s.logo_url ?? null,
      categories: Array.isArray(s.categories) ? s.categories : [],
      wa: contact.whatsapp ?? contact.phone ?? null,
      tel: contact.phone ?? null,
    };
  });

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <BusinessDirectoryContent snapshot={snapshot} sponsored={sponsored} />
      <Footer />
    </div>
  );
}