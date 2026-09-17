import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import { ClassifiedsFeed } from "@/components/classifieds/ClassifiedsFeed";

export default function ClassifiedsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon + Tema West
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Classifieds & Marketplace
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Properties, vehicles, goods, services, and jobs — posted by members, reviewed by
              admins. Listing is free.
            </p>
            <Link href="/submit">
              <Button variant="primary">List Something Free →</Button>
            </Link>
          </div>
        </section>
        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <ClassifiedsFeed />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
