"use client";

import { useEffect, useRef, useState } from "react";
import { COMMUNITY_SHOTS } from "@/lib/community";

const AUTOPLAY_MS = 5600;

export function CommunityStrip() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = COMMUNITY_SHOTS.length;
  const slide = COMMUNITY_SHOTS[index % count];

  useEffect(() => {
    if (paused || count <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, count]);

  const jump = (to: number) => setIndex(((to % count) + count) % count);

  return (
    <section className="w-full bg-light px-4 sm:px-6 pb-14 sm:pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1.5">
              The People of Klagon
            </div>
            <h2 className="text-[clamp(1.4rem,2.4vw,1.8rem)] font-extrabold text-navy tracking-tight leading-tight">
              Faces, work, and places — straight from the ground.
            </h2>
          </div>
          <span className="hidden sm:inline text-[11px] text-gray">
            {index + 1} / {count} · photos by {slide.credit}
          </span>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Klagon community photos"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative overflow-hidden rounded-2xl border border-border bg-white"
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {COMMUNITY_SHOTS.map((s, i) => (
              <figure key={s.src} className="w-full flex-shrink-0">
                <div className="relative aspect-[16/8] sm:aspect-[21/9]">
                  {/* Keep <img> honest: real owned files under /brand; credits in lib/community.ts */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <figcaption className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-navy/85 via-navy/40 to-transparent px-5 py-4 sm:px-6">
                    <div className="text-sm sm:text-base font-extrabold text-white tracking-tight max-w-2xl">
                      {s.caption}
                    </div>
                    <div className="text-[10px] text-white/70 font-semibold mt-0.5 tracking-wide">
                      Photo: {s.credit}
                    </div>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>

          {count > 1 && (
            <>
              <div className="absolute bottom-3 right-4 flex gap-1.5">
                {COMMUNITY_SHOTS.map((s, i) => (
                  <button
                    key={s.src}
                    type="button"
                    aria-label={`Go to photo ${i + 1}`}
                    onClick={() => jump(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === index ? "w-6 bg-amber" : "w-3 bg-white/60 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Toggle autoplay"
                onClick={() => setPaused((p) => !p)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-navy/60 text-white text-xs font-bold backdrop-blur cursor-pointer hover:bg-navy/80 transition-colors"
              >
                {paused ? "▶" : "❚❚"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
