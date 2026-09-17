import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapSection } from "@/components/sections/MapSection";

export const metadata = {
  title: "Klagon Map — See what's happening where",
  description:
    "An interactive community map of Klagon: projects, events, schools, health facilities, businesses and community points.",
};

export default function MapPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <MapSection />
      <Footer />
    </div>
  );
}