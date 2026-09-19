import type { SponsorRow } from "@/lib/sponsors";

export interface SponsorScore {
  total: number;
  breakdown: { label: string; points: number; max: number }[];
  missing: string[];
  claimed: boolean;
}

/**
 * Completeness score for a sponsor profile — 0..100, pure and deterministic so
 * it is safe to call from server components, tests, and the homepage.
 *
 * Scores what a *visitor or buyer* actually needs to make a decision:
 *   photos       0..20   — at least one real photo of the place/product
 *   price_range  0..15   — a stay or product needs a price to be bookable
 *   opening_hours 0..10  — walk-ins need to know when
 *   contact      0..10   — a phone / WhatsApp / email to actually reach out
 *   claimed      0..15   — an owner verifying the profile says it's real
 *   logo/cover   0..10   — the place is recognisable
 *   about+why_supports 0..10 — tells the community story
 *   location     0..10   — people need to find you (address or map point)
 * ----------------------------------------------------------------
 *   bonus/cap    0..100  (cap at 100)
 */
export function sponsorScore(s: SponsorRow): SponsorScore {
  const has = (arr: unknown[]) => Array.isArray(arr) && arr.length > 0;
  const missing: string[] = [];

  const photos = has(s.photos);
  const price = !!s.price_range;
  const hours = !!s.opening_hours;
  const contact =
    !!parseContact(s.contact).phone ||
    !!parseContact(s.contact).whatsapp ||
    !!parseContact(s.contact).email;
  const claimed = !!s.claimed_by;
  const brand = !!s.logo_url || !!s.cover_url;
  const story = !!s.about;
  const located = !!s.address || (s.latitude != null && s.longitude != null);

  const breakdown = [
    { label: "Photos", points: photos ? 20 : 0, max: 20 },
    { label: "Price", points: price ? 15 : 0, max: 15 },
    { label: "Opening hours", points: hours ? 10 : 0, max: 10 },
    { label: "Contact", points: contact ? 10 : 0, max: 10 },
    { label: "Owner claim", points: claimed ? 15 : 0, max: 15 },
    { label: "Logo / cover", points: brand ? 10 : 0, max: 10 },
    { label: "Community story", points: story ? 10 : 0, max: 10 },
    { label: "Findable location", points: located ? 10 : 0, max: 10 },
  ];

  if (!photos) missing.push("Add a real photo");
  if (!price) missing.push("Publish a price");
  if (!hours) missing.push("Set opening hours");
  if (!contact) missing.push("Add a phone or WhatsApp");
  if (!claimed) missing.push("Claim this listing");
  if (!brand) missing.push("Upload a logo");
  if (!story) missing.push("Tell your story");
  if (!located) missing.push("Add an address or map pin");

  const total = Math.min(100, breakdown.reduce((a, b) => a + b.points, 0));
  return { total, breakdown, missing, claimed };
}

export function byCompleteness(a: SponsorRow, b: SponsorRow): number {
  return sponsorScore(b).total - sponsorScore(a).total;
}
