"use client";

import Link from "next/link";
import { Radio } from "lucide-react";
import { recordLeadEvent } from "@/lib/analytics";

/**
 * RadioListenChip — homepage hero "listen" affordance.
 * The station is only on air while our Broadcaster PC is running, so the chip
 * never claims a hard LIVE status; /radio explains the schedule and the off-air
 * case. Pulses to read as "broadcasting" without asserting a live stream.
 */
export function RadioListenChip() {
  return (
    <Link
      href="/radio"
      onClick={() => recordLeadEvent({ source: "home-hero", action: "radio-click" })}
      title="Klagon Radio — free community radio. On air when our Broadcaster PC is on; check the schedule on the page."
      aria-label="Listen to Klagon Radio, free community radio"
      className="inline-flex items-center gap-2.5 bg-amber/15 border border-amber/30 hover:bg-amber/25 rounded-full pl-2.5 pr-4 py-1.5 transition-colors"
    >
      <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber/20 flex-shrink-0">
        <span className="absolute inset-0 rounded-full bg-amber/40 radio-pulse" aria-hidden="true" />
        <Radio size={13} className="relative text-amber" aria-hidden="true" />
      </span>
      <span className="text-xs font-bold text-amber whitespace-nowrap">Listen</span>
      <span className="text-xs font-medium text-white/60 whitespace-nowrap hidden sm:inline">
        Klagon Radio — free, no app
      </span>
    </Link>
  );
}
