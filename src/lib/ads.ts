// ------------------------------------------------------------------
// Advertising policy + telemetry.
//
// Two concerns live here together on purpose:
//
//  1. WHERE an ad may render. Third-party ad networks are gated by an
//     explicit ALLOWLIST that fails CLOSED. Klagon publishes 740
//     auto-imported directory listings whose meta descriptions are
//     near-identical templates — that is precisely the low-value-content
//     pattern that earns a domain-wide policy action, and such an action
//     would kill AdSense on the blog and radio too. A new route therefore
//     gets no third-party ads until someone deliberately allows it.
//
//     First-party sponsor inventory uses a deny-list instead, because that
//     inventory is revenue we own and label honestly. It is still barred
//     from payment, form, course and private screens, where an ad costs
//     more trust (and conversions) than it earns.
//
//  2. HOW an impression is counted. Deduped to once per browser session
//     per slot. Raw counting would write a row per page view per slot and
//     drown the conversion events this table also carries.
// ------------------------------------------------------------------

import { recordLeadEvent } from "@/lib/analytics";

/** Every ad position in the product. Typed so typos fail the build. */
export const AD_SLOTS = [
  "radio-top",
  "radio-mid",
  "radio-sponsors",
  "home-mid",
  "blog-inline",
  "news-inline",
  "jobs-mid",
  "classifieds-mid",
  "events-mid",
  "sponsors-wall",
  "business-sponsored",
  "directory-sponsored",
] as const;

export type AdSlot = (typeof AD_SLOTS)[number];

/** Reserved for ad telemetry so it can be queried apart from real leads. */
export const AD_SOURCE = "ad";

/**
 * Routes where third-party ad code may run. Fails closed: a route that is
 * not listed here never receives AdSense.
 */
const THIRD_PARTY_ALLOW = [
  "/",
  "/blog",
  "/news",
  "/events",
  "/jobs",
  "/classifieds",
  "/culture",
  "/radio",
  "/sponsors",
] as const;

/**
 * Screens that carry no advertising of any kind: taking money, asking for
 * personal data, teaching, or showing private/member state.
 *
 * Every entry is prefix-matched with a trailing slash, so a sub-route added
 * later cannot quietly become ad-eligible. This is also why "/sponsor" (the
 * form) can be denied while "/sponsors" (the wall) stays sellable: the
 * matcher only treats "/sponsor" and "/sponsor/…" as matches, never
 * "/sponsors".
 */
const NO_AD_PREFIX = [
  "/auth",
  "/admin",
  "/dashboard",
  "/my",
  "/learning",
  "/people",
  "/tools",
  "/visit",
  "/forum/ask",
  "/volunteer/apply",
  "/donate",
  "/sponsor",
  "/submit",
  "/coming-soon",
  "/404",
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  // "/" must match the site root exactly, never as a catch-all.
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Normalise a path for policy checks: leading slash, no query/hash/trailing slash. */
export function normalizePath(pathname: string | null | undefined): string {
  let p = (pathname ?? "/").split("#")[0].split("?")[0].trim().toLowerCase();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

/** True on screens where no advertising of any kind belongs. */
export function isAdFreeRoute(pathname: string | null | undefined): boolean {
  const p = normalizePath(pathname);
  return NO_AD_PREFIX.some((prefix) => matchesPrefix(p, prefix));
}

/** True where our own labelled sponsor inventory may run. */
export function isFirstPartyAdRouteAllowed(pathname: string | null | undefined): boolean {
  return !isAdFreeRoute(pathname);
}

/** True where a third-party network script may run. */
export function isThirdPartyAdRouteAllowed(pathname: string | null | undefined): boolean {
  const p = normalizePath(pathname);
  if (isAdFreeRoute(p)) return false;
  return THIRD_PARTY_ALLOW.some((prefix) => matchesPrefix(p, prefix));
}

const SEEN_KEY = "klagon_ad_impressions";

/**
 * Pure half of impression de-duplication: has this placement been counted
 * already in the current session?
 *
 * Split out from the sessionStorage read so the rule that decides whether a
 * paid placement is credited can be tested without a browser.
 */
export function hasSeenPlacement(seen: readonly string[], dedupeKey: string): boolean {
  return seen.includes(dedupeKey);
}

/** The list to persist once `dedupeKey` has been credited. Order is preserved. */
export function withPlacementSeen(seen: readonly string[], dedupeKey: string): string[] {
  return [...seen, dedupeKey];
}

function alreadySeenThisSession(dedupeKey: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    const seen: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (hasSeenPlacement(seen, dedupeKey)) return true;
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify(withPlacementSeen(seen, dedupeKey)));
    return false;
  } catch {
    // Private mode or a full quota: fall back to counting the impression.
    return false;
  }
}

export type AdMetadata = Record<string, string | number | boolean | null>;

/**
 * A paying partner rendered as a labelled placement in the directory.
 *
 * Sponsors live in their own curated table and do not share slugs with the
 * auto-imported business listings, so they can never be merged into the
 * organic results — they are shown as their own clearly-marked block instead.
 * This is a serialisable projection of a sponsor row, safe to pass into a
 * client component.
 */
export interface SponsoredPlacement {
  slug: string;
  name: string;
  tier: string;
  tagline: string | null;
  logoUrl: string | null;
  categories: string[];
  /**
   * Kept separate from `phone` on purpose. A number that was never registered
   * on WhatsApp still opens a wa.me chat, but labelling that button "WhatsApp"
   * would be claiming something untrue about the business.
   */
  whatsapp: string | null;
  phone: string | null;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Very light plural folding, only so a curated category like "Bakeries" still
 * matches a sponsor's "Bakery". Deliberately crude: it only decides whether a
 * placement is shown, and over-matching here is harmless because a partner is
 * always labelled as a partner and links to its own profile.
 */
function stemWord(word: string) {
  if (word.length > 3 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Word-level containment, so "Bakery" matches "Bakeries & Confectioneries". */
function wordsOverlap(a: string, b: string) {
  const left = normalizeText(a)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stemWord);
  const right = new Set(
    normalizeText(b)
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(stemWord),
  );
  if (left.length === 0 || right.size === 0) return false;
  return left.some((w) => right.has(w));
}

/**
 * Keep only the partners that plausibly answer what the reader asked for.
 *
 * Sponsors are curated separately from the listings, so they are never forced
 * into the organic result set. But they must also not wander into it: a reader
 * who searched for a bakery should not be shown an engineering firm just
 * because that firm pays. A partner is kept only when its own name, tagline or
 * categories actually match the reader's search or category filter.
 *
 * Matching is deliberately loose on categories (either string contains the
 * other) because the sponsor and listing taxonomies are curated separately and
 * will not always use identical wording. Failing to match only costs the
 * sponsor an impression; it never produces a misleading one.
 */
export function matchSponsors(
  sponsors: readonly SponsoredPlacement[],
  filter: { term?: string; category?: string } = {},
): SponsoredPlacement[] {
  const term = normalizeText(filter.term ?? "");
  const category = normalizeText(filter.category ?? "");

  return sponsors.filter((s) => {
    if (term) {
      const haystack = normalizeText(
        [s.name, s.tagline ?? "", ...s.categories].join(" "),
      );
      if (!haystack.includes(term)) return false;
    }
    if (category) {
      const hit = s.categories.some((c) => wordsOverlap(c, category));
      if (!hit) return false;
    }
    return true;
  });
}

/** One impression per slot per session. Never throws. */
/**
 * Counts one viewable impression for a placement.
 *
 * `dedupeKey` exists because a slot can hold several distinct paid placements.
 * A block of three sponsor cards is one slot, but each sponsor needs its own
 * per-session impression to be able to prove they were seen; keying the session
 * on the slot alone would credit only the first card and silently swallow the
 * rest. The reported `slot` stays the same either way, so reporting groups by
 * position while de-duplication groups by advertiser.
 */
export function recordAdImpression(
  slot: AdSlot,
  metadata?: AdMetadata,
  dedupeKey?: string,
): void {
  if (typeof window === "undefined") return;
  if (alreadySeenThisSession(dedupeKey ?? slot)) return;
  recordLeadEvent({ source: AD_SOURCE, action: "impression", metadata: { slot, ...metadata } });
}

/** A click is always worth recording; the caller supplies who/what. */
export function recordAdClick(slot: AdSlot, metadata?: AdMetadata): void {
  if (typeof window === "undefined") return;
  recordLeadEvent({ source: AD_SOURCE, action: "click", metadata: { slot, ...metadata } });
}
