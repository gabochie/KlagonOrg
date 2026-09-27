"use client";

import { useEffect, useRef } from "react";
import { recordAdImpression, type AdMetadata, type AdSlot } from "@/lib/ads";

/**
 * Counts an ad impression when the slot is genuinely on screen.
 *
 * Two guards keep the telemetry table honest and small:
 *  - viewability: fires from an IntersectionObserver, so a slot the reader
 *    never scrolled to is not counted;
 *  - de-duplication: `recordAdImpression` allows one count per slot per
 *    browser session.
 *
 * Returns a ref to attach to the slot's wrapper element.
 */
export function useAdImpression<T extends HTMLElement = HTMLElement>(
  slot: AdSlot,
  metadata?: AdMetadata,
  threshold = 0.5,
) {
  const ref = useRef<T | null>(null);
  // Serialised rather than referenced directly: an inline object literal
  // would otherwise be a new dependency on every render, and reading it in
  // the effect body would trip the exhaustive-deps rule.
  const metaKey = JSON.stringify(metadata ?? null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const meta = metaKey === "null" ? undefined : (JSON.parse(metaKey) as AdMetadata);

    if (typeof IntersectionObserver === "undefined") {
      // Very old browsers: fall back to counting it as seen.
      recordAdImpression(slot, meta);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          recordAdImpression(slot, meta);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slot, threshold, metaKey]);

  return ref;
}
