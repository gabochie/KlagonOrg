import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ForumSection } from "@/components/forum/ForumSection";

export default function ForumPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <ForumSection />
      <Footer />
    </div>
  );
}