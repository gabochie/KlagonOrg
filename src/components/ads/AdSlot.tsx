"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { recordLeadEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SCRIPT_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

interface AdSlotProps {
  /** Ad unit id. Leave unset to keep the slot reserved but unserved. */
  slot?: string;
  label: string;
  /** Rendered in place of the ad while no ad unit is configured. */
  houseAd?: ReactNode;
  className?: string;
}

/**
 * A reserved advertising slot.
 *
 * Nothing third-party loads until NEXT_PUBLIC_ADSENSE_CLIENT and a slot id are
 * both present at build time, so the page stays clean and consent-free while
 * the inventory is being sold. Until then the slot shows first-party house
 * advertising, which is the inventory we actually control.
 *
 * Impressions are measured with an IntersectionObserver rather than assumed
 * from page loads, so sponsor reporting reflects ads a human actually saw.
 */
export function AdSlot({ slot, label, houseAd, className }: AdSlotProps) {
  const ref = useRef<HTMLElement>(null);
  const counted = useRef(false);
  const configured = Boolean(CLIENT && slot);

  useEffect(() => {
    if (!configured) return;

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers can break the global; the page must still work.
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || counted.current) continue;
          counted.current = true;
          recordLeadEvent({ source: "radio", action: "ad-impression", metadata: { slot: label } });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [configured, label]);

  if (!configured) return houseAd ? <>{houseAd}</> : null;

  return (
    <aside
      ref={ref}
      aria-label={label}
      className={cn("w-full overflow-hidden", className)}
    >
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray/70">
        Advertisement
      </span>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
