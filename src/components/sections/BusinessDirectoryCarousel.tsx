"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export interface BusinessShot {
  src: string;
  alt: string;
}

/**
 * The hero pool for the Klagon business directory: all local business photos,
 * shown as an autoplay slideshow. Sources are real owned files under
 * /public/brand/business (see folder listing). Alt text stays descriptive of
 * the scene, never a claim about who someone is.
 */
export const BIZ_SHOTS: BusinessShot[] = [
  { src: "/brand/business/biz-01.jpeg", alt: "Local business and services in the community" },
  { src: "/brand/business/biz-02.jpg", alt: "A neighbourhood grocery store" },
  { src: "/brand/business/biz-03.jpg", alt: "A street scene of local trade" },
  { src: "/brand/business/biz-04.jpeg", alt: "Local business activity" },
  { src: "/brand/business/biz-05.jpg", alt: "A small community business" },
  { src: "/brand/business/biz-06.jpg", alt: "A local shop and its wares" },
  { src: "/brand/business/biz-07.webp", alt: "A market with food and goods stalls" },
  { src: "/brand/business/biz-08.jpg", alt: "A health clinic and pharmacy" },
  { src: "/brand/business/biz-09.jpg", alt: "A woman entrepreneur" },
  { src: "/brand/business/biz-10.jpg", alt: "A business scene photograph" },
  { src: "/brand/business/biz-11.jpg", alt: "A fashion studio and its garments" },
  { src: "/brand/business/biz-12.jpg", alt: "A pharmacy counter" },
  { src: "/brand/business/biz-13.jpg", alt: "A fabric supplier reviewing textiles" },
];

const AUTOPLAY_MS = 5600;

export function BusinessDirectoryCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = BIZ_SHOTS.length;

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
      aria-label="Businesses of Klagon"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/40"
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {BIZ_SHOTS.map((s, i) => (
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
            {BIZ_SHOTS.map((s, i) => (
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