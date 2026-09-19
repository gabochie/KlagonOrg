import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SponsorWallContent } from "@/components/sponsor/SponsorWallContent";

export const metadata: Metadata = {
  title: "Sponsor Wall — KLAGON.org",
  description:
    "Meet the verified businesses partnering with KLAGON to support youth, jobs, and innovation in Klagon.",
  alternates: { canonical: "/sponsors" },
};

export default function SponsorsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <SponsorWallContent />
      <Footer />
    </div>
  );
}