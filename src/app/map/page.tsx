import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapSection } from "@/components/sections/MapSection";

export const metadata = {
  title: "Klagon Knowledge Map — See what's happening where",
  description:
    "The Klagon Knowledge Map: an interactive community map of places and needs in Klagon — projects, events, schools, health facilities, businesses and more, each with its own page.",
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