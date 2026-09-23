"use client";

import { useEffect, useRef } from "react";
import { loadTurnstileScript, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

export function Turnstile({
  onToken,
  className = "",
  onError,
}: {
  onToken: (token: string | null) => void;
  className?: string;
  onError?: (message: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let mounted = true;
    let attempts = 0;
    const maxAttempts = 3;

    const attempt = () => {
      if (!mounted || widgetIdRef.current) return;
      loadTurnstileScript()
        .then(() => {
          if (!mounted || widgetIdRef.current) return;
          if (!window.turnstile) throw new Error("turnstile-unavailable");
          try {
            widgetIdRef.current = window.turnstile.render(divRef.current as HTMLElement, {
              sitekey: TURNSTILE_SITE_KEY,
              action: "turnstile-spin-v2",
              callback: (token: unknown) => onTokenRef.current?.(String(token)),
              "expired-callback": () => onTokenRef.current?.(null),
              "error-callback": () => onTokenRef.current?.(null),
            });
          } catch {
            onErrorRef.current?.("Could not render the human check. Please reload the page.");
          }
        })
        .catch(() => {
          if (!mounted) return;
          attempts += 1;
          if (attempts < maxAttempts) setTimeout(attempt, 1000 * attempts);
          else
            onErrorRef.current?.(
              "Could not load the human check from your network. Please check your connection and reload the page."
            );
        });
    };

    attempt();

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