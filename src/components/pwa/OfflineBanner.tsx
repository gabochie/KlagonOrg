"use client";

import { usePathname } from "next/navigation";
import { useOnlineStatus } from "./useOnlineStatus";
import { shouldHideBottomNav } from "@/lib/mobileChrome";
import { cn } from "@/lib/utils";

/**
 * Slim bar that appears only while the connection is down.
 *
 * Anchored to the bottom rather than the top on purpose: the navbar is sticky,
 * and a banner above it would either push the header around as it appears or
 * sit underneath it. Bottom also puts it in the thumb zone, where a visitor who
 * has just watched a page fail to load will actually see it.
 *
 * It clears the mobile tab bar where that bar is shown, so the two fixed
 * elements stack instead of covering each other; on routes with no tab bar
 * (and from `md` up) it drops back to the very bottom.
 *
 * It caches nothing and gates nothing. There is no service worker, so coming
 * back online simply lets the next request succeed; the banner's only job is to
 * explain the failure that already happened rather than leave the visitor
 * wondering whether the site has broken.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const pathname = usePathname();

  if (isOnline) return null;

  const aboveTabBar = !shouldHideBottomNav(pathname);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 z-50 px-3 pt-3 pointer-events-none",
        aboveTabBar
          ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom))] pb-3 md:bottom-0 md:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto max-w-lg pointer-events-auto flex items-start gap-2.5 rounded-xl border border-amber bg-navy px-3.5 py-3 shadow-lg">
        <span aria-hidden="true" className="text-base leading-none mt-0.5">
          📡
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white">You are offline</div>
          <div className="text-[11px] text-white/70 mt-0.5">
            This page could not reach KLAGON. It will load again once you reconnect.
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 inline-flex min-h-11 items-center rounded-lg bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    </div>
  );
}