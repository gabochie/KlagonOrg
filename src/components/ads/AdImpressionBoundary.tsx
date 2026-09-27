"use client";

import type { ReactNode } from "react";
import { useAdImpression } from "@/components/ads/useAdImpression";
import type { AdMetadata, AdSlot } from "@/lib/ads";

/**
 * Attaches a viewability-based impression count to server-rendered children.
 *
 * Lets a server component keep prerendering its markup into the static HTML
 * while still reporting a real impression for the ad slot it occupies.
 *
 * `dedupeKey` identifies the individual placement when several share a slot.
 */
export function AdImpressionBoundary({
  slot,
  metadata,
  dedupeKey,
  className,
  children,
}: {
  slot: AdSlot;
  metadata?: AdMetadata;
  dedupeKey?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useAdImpression<HTMLDivElement>(slot, metadata, { dedupeKey });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
