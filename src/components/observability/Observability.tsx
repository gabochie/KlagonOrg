"use client";

// ------------------------------------------------------------------
// Observability mount — self-hosted error log + Cloudflare Web
// Analytics. Renders nothing visible. Every path degrades to a no-op
// when unconfigured (local dev, CI, pre-migration). Cookieless, so no
// consent banner is required.
// ------------------------------------------------------------------

import { useEffect } from "react";
import Script from "next/script";
import { cfBeaconToken, reportError } from "@/lib/observability";

export { reportError };

export function Observability() {
  const beacon = cfBeaconToken();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportError(event.error ?? event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      void reportError(event.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!beacon) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token: beacon })}
    />
  );
}
