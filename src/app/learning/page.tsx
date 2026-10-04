import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LearningHubContent } from "@/components/sections/LearningHubContent";

export const metadata: Metadata = {
  // No "| KLAGON.org" suffix here: the root layout applies the "%s | KLAGON.org"
  // title template, so spelling it out here rendered the brand twice.
  title: "Klagon Digital Academy",
  description:
    "Free short courses from the Klagon Digital Academy in AI & Tech, Financial Literacy, Leadership, Entrepreneurship, Communication and Career Planning. Built for Klagon youth — no laptop required to start.",
  alternates: { canonical: "/learning" },
};

export default function LearningPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <LearningHubContent />
      <Footer />
    </div>
  );
}