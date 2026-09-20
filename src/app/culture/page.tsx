import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CultureHub } from "@/components/sections/CultureHub";

export default function CulturePage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <CultureHub />
      <Footer />
    </div>
  );
}