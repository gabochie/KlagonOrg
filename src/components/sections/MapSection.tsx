"use client";

// MapSection — the landing content for /map/. Mirrors ProjectsSection
// layout: navy hero + light body holding the interactive map.

import { MapExplorer } from "@/components/map/MapExplorer";

export function MapSection() {
  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Klagon Map
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            See what&apos;s happening where.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Projects, events, schools, health facilities, businesses and community
            points — plotted together so everyone can see Klagon at a glance.
          </p>
        </div>
      </section>

      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <MapExplorer />
        </div>
      </section>
    </main>
  );
}