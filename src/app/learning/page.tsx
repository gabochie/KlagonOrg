import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LearningHubContent } from "@/components/sections/LearningHubContent";

export const metadata: Metadata = {
  title: "Learning Hub — KLAGON.org",
  description:
    "Free learning tracks in AI & Tech, Financial Literacy, Leadership, Entrepreneurship, Communication and Career Planning.",
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