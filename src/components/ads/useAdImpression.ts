"use client";

import { useEffect, useRef } from "react";
import { recordAdImpression, type AdMetadata, type AdSlot } from "@/lib/ads";

/**
 * Counts an ad impression when the placement is genuinely on screen.
 *
 * Two guards keep the telemetry table honest and small:
 *  - viewability: fires from an IntersectionObserver, so a placement the reader
 *    never scrolled to is not counted;
 *  - de-duplication: one count per placement per browser session.
 *
 * Pass `dedupeKey` when a single slot holds several distinct paid placements
 * (a row of sponsor cards, say) so each one is credited independently instead
 * of the first one consuming the slot's single allowance.
 *
 * Returns a ref to attach to the placement's wrapper element.
 */
export function useAdImpression<T extends HTMLElement = HTMLElement>(
  slot: AdSlot,
  metadata?: AdMetadata,
  options: { threshold?: number; dedupeKey?: string } = {},
) {
  const ref = useRef<T | null>(null);
  const { threshold = 0.5, dedupeKey } = options;
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
      recordAdImpression(slot, meta, dedupeKey);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          recordAdImpression(slot, meta, dedupeKey);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slot, threshold, metaKey, dedupeKey]);

  return ref;
}
