"use client";

import { useEffect, useRef } from "react";
import { loadTurnstileScript, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

export function Turnstile({
  onToken,
  className = "",
}: {
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    let mounted = true;
    loadTurnstileScript().then(() => {
      if (!mounted || !divRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(divRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action: "turnstile-spin-v2",
        callback: (token: unknown) => onTokenRef.current?.(String(token)),
        "expired-callback": () => onTokenRef.current?.(null),
        "error-callback": () => onTokenRef.current?.(null),
      });
    });
    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div ref={divRef} className={`cf-turnstile ${className}`} />;
}