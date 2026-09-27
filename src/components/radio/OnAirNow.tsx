"use client";

import { useEffect, useState } from "react";
import {
  accraClock,
  currentShow,
  nextShow,
  onAirWindowLabel,
  type RadioShow,
} from "@/lib/radioSchedule";

interface Snapshot {
  on: RadioShow | null;
  next: RadioShow | null;
  clock: string;
}

/**
 * "On air now / next up", computed in the listener's own timezone-aware clock
 * (Africa/Accra). Renders a stable placeholder until the client clock is
 * available so server and client markup match.
 *
 * It reports the *scheduled* show, not whether audio is actually flowing. The
 * stream is only audible while the studio PC is on, which is why the copy
 * always pairs this with an off-air instruction rather than a bare "LIVE".
 */
export function OnAirNow({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    const tick = () => setSnap({ on: currentShow(), next: nextShow(), clock: accraClock() });
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const dark = tone === "dark";
  const chip = dark
    ? "border-white/15 bg-white/8 text-white/80"
    : "border-border bg-light text-navy";

  if (!snap) {
    return (
      <div className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${chip}`}>
        On air daily {onAirWindowLabel()} GMT
      </div>
    );
  }

  if (snap.on) {
    return (
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${chip}`}
        title={`Klagon time ${snap.clock}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
        </span>
        <span className="truncate">
          On air: <span className="text-amber">{snap.on.title}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${chip}`}
      title={`Klagon time ${snap.clock}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-white/30" />
      <span className="truncate">
        Off air{snap.next ? ` — ${snap.next.title} at ${String(Math.floor(snap.next.start / 60)).padStart(2, "0")}:00` : ""}
      </span>
    </div>
  );
}
