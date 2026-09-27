"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { recordLeadEvent } from "@/lib/analytics";
import { recordAdClick, type AdSlot } from "@/lib/ads";

const EXTERNAL = /^(https?:|tel:|mailto:)/;

interface TrackLinkProps {
  href: string;
  source: string;
  action: string;
  metadata?: Record<string, string | number | boolean | null>;
  className?: string;
  children: ReactNode;
  /** Force external handling (opens in a new tab) for a relative-looking href. */
  external?: boolean;
  /**
   * Set when this link is paid inventory. Records an ad click in addition to
   * the ordinary conversion event, so sponsor reporting and lead reporting
   * never have to be joined by hand.
   */
  adSlot?: AdSlot;
}

/**
 * Conversion-tracked link. Renders a real <a> for off-site/tel/mailto targets
 * (so the browser handles the protocol) and next/link for internal routes.
 * Telemetry is fire-and-forget and must never block navigation.
 */
export function TrackLink({
  href,
  source,
  action,
  metadata,
  className,
  children,
  external,
  adSlot,
}: TrackLinkProps) {
  const onClick = () => {
    if (adSlot) recordAdClick(adSlot, metadata);
    recordLeadEvent({ source, action, metadata });
  };

  if (external || EXTERNAL.test(href)) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
