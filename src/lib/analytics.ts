import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";

const UTM_KEY = "klagon_utm";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

type UtmBag = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

function currentUtm(): UtmBag {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const fresh: UtmBag = {};
    let found = false;
    for (const key of UTM_PARAMS) {
      const v = params.get(key);
      if (v) {
        fresh[key] = v.slice(0, 120);
        found = true;
      }
    }
    if (found) {
      window.sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const stored = window.sessionStorage.getItem(UTM_KEY);
    return stored ? (JSON.parse(stored) as UtmBag) : {};
  } catch {
    return {};
  }
}

export interface LeadEvent {
  source: string;
  action: string;
  page?: string;
  metadata?: Record<string, string | number | boolean | null>;
  memberId?: string | null;
}

/**
 * Fire-and-forget conversion telemetry. Never throws, never blocks UI.
 * Powers: which page/source produces sponsors, donors, volunteers, members.
 */
export function recordLeadEvent(event: LeadEvent): void {
  try {
    if (!isSupabaseConfigured()) return;
    const client = getBrowserClient();
    if (!client) return;
    const page =
      event.page ??
      (typeof window !== "undefined" ? window.location.pathname.slice(0, 160) : null);
    void client.from("lead_events").insert({
      member_id: event.memberId ?? null,
      source: event.source.slice(0, 60),
      action: event.action.slice(0, 60),
      page,
      metadata: { ...currentUtm(), ...(event.metadata ?? {}) },
    });
  } catch {
    // Telemetry must never break the user journey.
  }
}
