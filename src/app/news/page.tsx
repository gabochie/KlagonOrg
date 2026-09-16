import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsSection } from "@/components/sections/NewsSection";

export default function NewsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <NewsSection />
      <Footer />
    </div>
  );
}