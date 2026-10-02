"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the browser believes it has a network connection.
 *
 * Worth knowing what this is not: `navigator.onLine` only reports that a
 * network interface is up, not that anything is reachable. A phone attached to
 * a captive portal in a hotel, or a laptop on a wifi access point with no
 * upstream, both report `true` while every request fails. So this drives a
 * *hint*, never a gate: it must not be used to decide whether to attempt a
 * fetch, only to explain a failure the visitor is already looking at.
 *
 * State starts optimistic at `true` so the server render and the first client
 * render agree; reading `navigator.onLine` during initialisation would produce
 * a hydration mismatch on every offline load. The effect corrects it a tick
 * later.
 *
 * The `focus` listener covers a case the online/offline events miss: a tab
 * that was backgrounded while the connection dropped never receives the
 * `offline` event, so without resyncing on focus the banner would sit there
 * wrongly claiming everything is fine long after the network went away.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    const sync = () => setIsOnline(navigator.onLine);

    sync();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return isOnline;
}