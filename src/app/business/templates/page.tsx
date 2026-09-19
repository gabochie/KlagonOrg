import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TemplatesContent } from "@/components/sponsor/TemplatesContent";

export const metadata: Metadata = {
  title: "Business Templates — KLAGON.org",
  description:
    "Free downloadable business templates for finance, sales, operations, people, and marketing — brought to you by KLAGON's partners.",
  alternates: { canonical: "/business/templates" },
};

export default function TemplatesPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <TemplatesContent />
      <Footer />
    </div>
  );
}