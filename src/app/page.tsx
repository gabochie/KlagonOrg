import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { BusinessHighlights } from "@/components/landing/BusinessHighlights";
import { FourDoors } from "@/components/landing/FourDoors";
import { LearningHub } from "@/components/landing/LearningHub";
import { HomeLiveStrip } from "@/components/landing/HomeLiveStrip";
import { HomeJoinBand } from "@/components/landing/HomeJoinBand";
import { SponsorDonate } from "@/components/landing/SponsorDonate";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <Hero />
        <FourDoors />
        <BusinessHighlights />
        <LearningHub />
        <HomeLiveStrip />
        <HomeJoinBand />
        <SponsorDonate />
      </main>
      <Footer />
    </div>
  );
}
