"use client";

// MapSection — the landing content for /map/. Mirrors ProjectsSection
// layout: navy hero + light body holding the interactive map.

import { MapExplorer } from "@/components/map/MapExplorer";
import { ORG_WA, ORG_PHONE_DISPLAY, waLink } from "@/lib/directoryClaims";

export function MapSection() {
  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Klagon Knowledge Map
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            See what&apos;s happening where.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Projects, events, schools, health facilities, businesses and
            community needs — plotted together so everyone can see Klagon at a
            glance. Every place has its own page: click a pin or open the list.
          </p>
        </div>
      </section>

      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <MapExplorer />
          <p className="mt-4 text-center text-xs font-medium text-gray">
            Missing a place, or want to report a community need?{" "}
            <a
              href={waLink(
                ORG_WA,
                "Hi KlagonOrg! I'd like to report a community need or add a place to the Klagon map."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue hover:underline"
            >
              WhatsApp KLAGON on {ORG_PHONE_DISPLAY}
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}