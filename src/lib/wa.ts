// ------------------------------------------------------------------
// WhatsApp helpers — server-safe (no "use client"), importable from
// server components and static pages. Client modules re-export these
// where they need them.
// ------------------------------------------------------------------

/** KlagonOrg's own WhatsApp line — claims, group joins and map/need reports all land here. */
export const ORG_WA = "233268708895";
/** Display form of the org line used inside WhatsApp messages sent to third parties. */
export const ORG_PHONE_DISPLAY = "026 870 8895";

export function waLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}