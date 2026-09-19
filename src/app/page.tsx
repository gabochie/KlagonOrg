import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { CommunityStrip } from "@/components/landing/CommunityStrip";
import { BusinessHighlights } from "@/components/landing/BusinessHighlights";
import { FourDoors } from "@/components/landing/FourDoors";
import { JourneyPath } from "@/components/landing/JourneyPath";
import { ValueProps } from "@/components/landing/ValueProps";
import { EventsSection } from "@/components/landing/EventsSection";
import { LearningHub } from "@/components/landing/LearningHub";
import { CommunityProjects } from "@/components/landing/CommunityProjects";
import { KlagonTodayTabs } from "@/components/sections/KlagonTodayTabs";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Testimonials } from "@/components/landing/Testimonials";
import { RegistrationForm } from "@/components/landing/RegistrationForm";
import { SponsorDonate } from "@/components/landing/SponsorDonate";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <Hero />
        <CommunityStrip />
        <BusinessHighlights />
        <FourDoors />
        <JourneyPath />
        <ValueProps />
        <EventsSection />
        <LearningHub />
        <CommunityProjects />
        <KlagonTodayTabs />
        <DashboardPreview />
        <Testimonials />
        <RegistrationForm />
        <SponsorDonate />
      </main>
      <Footer />
    </div>
  );
}
