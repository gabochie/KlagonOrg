import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VolunteerSection } from "@/components/sections/VolunteerSection";

export default function VolunteerPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <VolunteerSection />
      <Footer />
    </div>
  );
}