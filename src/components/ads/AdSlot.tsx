"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isFirstPartyAdRouteAllowed, isThirdPartyAdRouteAllowed, type AdSlot as AdSlotId } from "@/lib/ads";
import { useAdImpression } from "@/components/ads/useAdImpression";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SCRIPT_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

interface AdSlotProps {
  /** Typed position id used for impression/click telemetry. */
  slot: AdSlotId;
  /** Google ad unit id. Omit to keep the slot reserved but unserved. */
  unit?: string;
  /** Rendered in place of the ad while no ad unit is configured. */
  houseAd?: ReactNode;
  className?: string;
}

/**
 * A reserved advertising slot.
 *
 * Nothing third-party loads until both the publisher id and a unit id are
 * present at build time, so the page stays clean and consent-free while the
 * inventory is being sold. Until then the slot shows first-party house
 * advertising, which is the inventory we actually control.
 *
 * Third-party code is additionally refused on any route outside the
 * allow-list in @/lib/ads — the directory and map are permanently excluded
 * so a stray slot can never risk the ad account.
 */
export function AdSlot({ slot, unit, houseAd, className }: AdSlotProps) {
  const pathname = usePathname();
  const thirdPartyAllowed = isThirdPartyAdRouteAllowed(pathname);
  const configured = Boolean(CLIENT && unit && thirdPartyAllowed);
  const ref = useAdImpression<HTMLDivElement>(slot);

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

  if (!configured) {
    if (!houseAd) return null;
    if (!isFirstPartyAdRouteAllowed(pathname)) return null;
    return <div ref={ref}>{houseAd}</div>;
  }

  return (
    <div ref={ref} className={cn("w-full overflow-hidden", className)}>
      <aside aria-label="Advertisement">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray/70">
          Advertisement
        </span>
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={CLIENT}
          data-ad-slot={unit}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    </div>
  );
}
