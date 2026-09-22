// ------------------------------------------------------------------
// Observability — self-hosted, zero vendors.
// Crash reports go to the client_errors table (anon insert, admin
// read) via reportError(); traffic goes to Cloudflare Web Analytics
// via the beacon. Everything degrades to a no-op when unconfigured:
//   NEXT_PUBLIC_CF_BEACON_TOKEN   (Cloudflare dashboard -> Analytics &
//                                  Logs -> Web Analytics -> Add site)
// The token is PUBLIC (ships in the client bundle by design).
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";

type ClientErrorInsert = Database["public"]["Tables"]["client_errors"]["Insert"];

export function cfBeaconToken(value?: string): string | null {
  const token = (value ?? process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "").trim();
  return token.length >= 8 ? token : null;
}

export interface ClientErrorPayload {
  message: string;
  stack: string | null;
  url: string;
  user_agent: string;
}

/** Pure payload builder — unit-tested, never touches the network. */
export function buildErrorPayload(err: unknown): ClientErrorPayload {
  const message = err instanceof Error ? err.message || err.name : String(err);
  const stack = err instanceof Error ? (err.stack ?? null) : null;
  return {
    message: message.slice(0, 1000),
    stack: stack ? stack.slice(0, 8000) : null,
    url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : "",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
  };
}

const SESSION_KEY = "klagon_err_count";
const MAX_PER_SESSION = 10;

/** Report a caught error. Flood-capped, never throws into the page. */
export async function reportError(err: unknown): Promise<void> {
  try {
    if (typeof window === "undefined" || !isSupabaseConfigured()) return;
    const seen = Number(window.sessionStorage.getItem(SESSION_KEY) ?? 0);
    if (Number.isFinite(seen) && seen >= MAX_PER_SESSION) return;
    window.sessionStorage.setItem(SESSION_KEY, String((Number.isFinite(seen) ? seen : 0) + 1));
    const client = getBrowserClient();
    if (!client) return;
    const payload: ClientErrorInsert = buildErrorPayload(err);
    if (!payload.message) return;
    await client.from("client_errors").insert(payload);
  } catch {
    // reporting must never break the page
  }
}
