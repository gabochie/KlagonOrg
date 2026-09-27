"use client";

import type { ReactNode } from "react";
import { useAdImpression } from "@/components/ads/useAdImpression";
import type { AdSlot } from "@/lib/ads";

/**
 * Attaches a viewability-based impression count to server-rendered children.
 *
 * Lets a server component keep prerendering its markup into the static HTML
 * while still reporting a real impression for the ad slot it occupies.
 */
export function AdImpressionBoundary({
  slot,
  className,
  children,
}: {
  slot: AdSlot;
  className?: string;
  children: ReactNode;
}) {
  const ref = useAdImpression<HTMLDivElement>(slot);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
