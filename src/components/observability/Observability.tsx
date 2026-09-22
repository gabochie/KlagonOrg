"use client";

// ------------------------------------------------------------------
// Observability mount — Sentry (free tier) + Cloudflare Web Analytics.
// Renders nothing visible. Initializes once; every path degrades to a
// no-op when the public env vars are absent (local dev, CI, pre-setup).
// Cookieless on both sides, so no consent banner is required.
// ------------------------------------------------------------------

import { useEffect } from "react";
import Script from "next/script";
import * as Sentry from "@sentry/browser";
import { sentryDsn, cfBeaconToken, sentryEnvironment } from "@/lib/observability";

let sentryReady = false;

/** Report a caught error (e.g. from error.tsx). No-op until init. */
export function reportError(err: unknown): void {
  if (!sentryReady) return;
  try {
    Sentry.captureException(err);
  } catch {
    // reporting must never break the page
  }
}

export function Observability() {
  const dsn = sentryDsn();
  const beacon = cfBeaconToken();

  useEffect(() => {
    if (!dsn || sentryReady) return;
    try {
      Sentry.init({
        dsn,
        environment: sentryEnvironment(),
        // Errors: full fidelity (the point of the free tier).
        // Traces/replays: off — keeps the free quota for crashes only.
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      });
      sentryReady = true;
    } catch {
      // telemetry must never break the page
    }
  }, [dsn]);

  if (!beacon) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token: beacon })}
    />
  );
}
