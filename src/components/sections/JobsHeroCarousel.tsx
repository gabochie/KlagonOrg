"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export interface JobsShot {
  src: string;
  alt: string;
}

/**
 * The hero pool for the Klagon jobs board. AI-generated illustration art
 * (owned files under /public/brand/jobs). Alt text stays scene-declarative
 * and honest — it describes artwork, never real people or events.
 */
export const JOBS_SHOTS: JobsShot[] = [
  { src: "/brand/jobs/jobs-hero.jpg", alt: "Illustration of people finding opportunities together" },
  { src: "/brand/jobs/jobs-01.jpg", alt: "Illustration of a neighbourhood career scene" },
  { src: "/brand/jobs/jobs-02.jpg", alt: "Illustration of hands-on training and apprenticeships" },
];

const AUTOPLAY_MS = 5600;

export function JobsHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = JOBS_SHOTS.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, count]);

  const jump = (to: number) => setIndex(((to % count) + count) % count);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Opportunities in Klagon"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/40"
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {JOBS_SHOTS.map((s, i) => (
          <figure key={s.src} className="w-full flex-shrink-0">
            <div className="relative aspect-[16/10] md:aspect-[3/2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={s.alt}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </figure>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Toggle autoplay"
            onClick={() => setPaused((p) => !p)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-navy/60 text-white flex items-center justify-center backdrop-blur cursor-pointer hover:bg-navy/80 transition-colors"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <div className="absolute bottom-2.5 right-3 flex gap-1.5">
            {JOBS_SHOTS.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => jump(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? "w-6 bg-amber" : "w-3 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}