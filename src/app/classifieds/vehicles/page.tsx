import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import { ClassifiedsFeed } from "@/components/classifieds/ClassifiedsFeed";

export const metadata: Metadata = {
  title: "Vehicles for Sale & Hire in Klagon — KLAGON.org Classifieds",
  description:
    "Cars, SUVs, pickups, and motorcycles for sale or hire in Klagon and Tema West, posted by the community.",
  alternates: { canonical: "/classifieds/vehicles" },
};

export default function VehiclesPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon + Tema West · For Sale · For Hire
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Vehicle Listings
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Cars, SUVs, pickups, and motorcycles — with make, year, mileage, and condition on
              every listing.
            </p>
            <Link href="/submit">
              <Button variant="primary">List a Vehicle Free →</Button>
            </Link>
          </div>
        </section>
        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <ClassifiedsFeed initialVertical="Auto" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
