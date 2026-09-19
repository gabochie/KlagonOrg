import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BusinessDirectoryContent } from "@/components/sections/BusinessDirectoryContent";
import type { DirectorySnapshot } from "@/lib/directory";
import snapshotData from "@/data/business-directory.json";

export const metadata: Metadata = {
  title: "Business Directory — Klagon, Lashibi & Tema | KLAGON.org",
  description:
    "Find 740 businesses in Klagon, Lashibi and Tema — shops, clinics, schools, pharmacies and services. Search by name or category, get directions, and claim your free listing.",
  alternates: { canonical: "/business" },
};

export default function BusinessPage() {
  const snapshot = snapshotData as unknown as DirectorySnapshot;
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <BusinessDirectoryContent snapshot={snapshot} />
      <Footer />
    </div>
  );
}