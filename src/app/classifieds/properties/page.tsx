import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import { ClassifiedsFeed } from "@/components/classifieds/ClassifiedsFeed";

export const metadata: Metadata = {
  title: "Property for Rent & Sale in Klagon — KLAGON.org Classifieds",
  description:
    "Houses, flats, land, shops, and short-stays for rent and sale in Klagon and Tema West, posted by the community.",
  alternates: { canonical: "/classifieds/properties" },
};

export default function PropertiesPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon + Tema West · Rent · Sale · Short-Stay
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Property Listings
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Houses, flats, land, shops, and Airbnb-style stays — with beds, size, and clear
              pricing on every listing.
            </p>
            <Link href="/submit">
              <Button variant="primary">List Property Free →</Button>
            </Link>
          </div>
        </section>
        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <ClassifiedsFeed initialVertical="Properties" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
