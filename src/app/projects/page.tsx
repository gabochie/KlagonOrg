import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ProjectsSection } from "@/components/sections/ProjectsSection";

export default function ProjectsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <ProjectsSection />
      <Footer />
    </div>
  );
}