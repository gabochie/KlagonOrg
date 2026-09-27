"use client";

import { useEffect, useRef } from "react";
import { recordLeadEvent } from "@/lib/analytics";

const SCRIPT_SRC = "https://cdn.cloud.caster.fm/widgets/embed.js";

/** Public embed token for the Klagon Radio Caster.fm account. */
const PUBLIC_TOKEN = "87d9ebef-bd0e-48eb-956d-bff39da248ab";

/**
 * The station player.
 *
 * We deliberately use Caster.fm's official widget rather than a hand-rolled
 * <audio> element: the stream is protected, so only the widget can negotiate
 * playback auth. The wrapper is the single mount point for that widget, so it
 * must never be rendered twice — a second copy would mean a second audio
 * element fighting over the same stream.
 *
 * Because it lives in one place, the page can keep it pinned on screen while a
 * listener reads the sponsorship and donation sections below.
 */
export function CasterPlayer({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const engaged = useRef(false);

  useEffect(() => {
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.body.appendChild(s);
    }

    const node = wrapRef.current;
    if (!node) return;

    // The widget renders its own controls, so we listen in the capture phase at
    // the wrapper. One "engaged" event per page view is enough to measure
    // listen-through; counting every click would flood lead_events.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      // Ignore the pre-render Caster.fm fallback links.
      if (target?.closest("a")) return;
      if (engaged.current) return;
      engaged.current = true;
      recordLeadEvent({ source: "radio", action: "player-engage" });
    };

    node.addEventListener("click", onClick);
    return () => node.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <div
        className="cstrEmbed"
        data-type="newStreamPlayer"
        data-publicToken={PUBLIC_TOKEN}
        data-theme="light"
        data-color="0F1B5C"
        data-channelId=""
        data-rendered="false"
      >
        <a href="https://www.caster.fm">Shoutcast Hosting</a>{" "}
        <a href="https://www.caster.fm">Stream Hosting</a>{" "}
        <a href="https://www.caster.fm">Radio Server Hosting</a>
      </div>
    </div>
  );
}
