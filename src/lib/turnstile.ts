export const TURNSTILE_SITE_KEY = "0x4AAAAAAExsxeXhW6cuJHER";

const WORKER_BASE = "https://klagon-payments.gideonabochie.workers.dev";

export async function verifyTurnstile(token: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const res = await fetch(`${WORKER_BASE}/api/turnstile/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return { success: data?.success === true, error: data?.error ?? null };
  } catch {
    return { success: false, error: "Could not verify your human check. Please try again." };
  }
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}