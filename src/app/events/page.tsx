import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { EventsSection } from "@/components/sections/EventsSection";

export default function EventsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <EventsSection />
      <Footer />
    </div>
  );
}