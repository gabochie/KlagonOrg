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
      reset: (widgetId: string) => void;
      execute: (widgetId: string, opts?: Record<string, unknown>) => void;
      remove: (id: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("turnstile-script-failed"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

let invisibleHost: HTMLElement | null = null;
let invisibleWidgetId: string | null = null;

interface Pending {
  resolve: (t: string) => void;
  reject: (e: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

let pending: Pending | null = null;

function settlePending() {
  const p = pending;
  pending = null;
  clearTimeout(p?.timeout);
  return p;
}

async function ensureInvisibleWidget() {
  if (invisibleWidgetId) return;
  await loadTurnstileScript();
  if (!window.turnstile) return;
  if (!invisibleHost) {
    invisibleHost = document.createElement("div");
    invisibleHost.setAttribute("data-klagon-turnstile-invisible", "");
    invisibleHost.style.position = "fixed";
    invisibleHost.style.width = "1px";
    invisibleHost.style.height = "1px";
    invisibleHost.style.left = "-9999px";
    invisibleHost.style.top = "0";
    invisibleHost.style.opacity = "0";
    invisibleHost.style.pointerEvents = "none";
    document.body.appendChild(invisibleHost);
  }
  invisibleWidgetId = window.turnstile.render(invisibleHost, {
    sitekey: TURNSTILE_SITE_KEY,
    size: "invisible",
    action: "turnstile-spin-v2",
    callback: (token: unknown) => {
      const p = settlePending();
      const w = invisibleWidgetId;
      invisibleWidgetId = null;
      if (p) p.resolve(String(token));
      if (w) window.turnstile?.remove(w);
      void ensureInvisibleWidget();
    },
    "expired-callback": () => {
      const p = settlePending();
      const w = invisibleWidgetId;
      invisibleWidgetId = null;
      if (p) p.reject(new Error("turnstile-expired"));
      if (w) window.turnstile?.remove(w);
      void ensureInvisibleWidget();
    },
    "error-callback": () => {
      const p = settlePending();
      const w = invisibleWidgetId;
      invisibleWidgetId = null;
      if (p) p.reject(new Error("turnstile-error"));
      if (w) window.turnstile?.remove(w);
      void ensureInvisibleWidget();
    },
  });
}

export function getInvisibleToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("turnstile-unavailable"));
      return;
    }
    const existing = settlePending();
    if (existing) existing.reject(new Error("turnstile-superseded"));
    const timeout = setTimeout(() => {
      const p = settlePending();
      if (p) p.reject(new Error("turnstile-timeout"));
    }, 15000);
    pending = { resolve, reject, timeout };
    void ensureInvisibleWidget().then(() => {
      if (!window.turnstile || !invisibleWidgetId) {
        const p = settlePending();
        if (p) p.reject(new Error("turnstile-unavailable"));
        return;
      }
      window.turnstile.execute(invisibleWidgetId as string);
    });
  });
}