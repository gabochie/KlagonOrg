import { PortalFeed } from "@/components/posts/PortalFeed";

export function NewsSection() {
  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Klagon Community Portal
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            News, events & marketplace
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Stories, events, businesses, classifieds and jobs — posted by the community and
            reviewed by moderators.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <PortalFeed />
        </div>
      </section>
    </main>
  );
}