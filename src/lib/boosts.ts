/**
 * Paid boost ("featured") placement rules, kept pure so the ranking, the badge
 * and any future purchase UI all agree on what counts as boosted.
 *
 * The single most important rule here: a boost is only active until it
 * expires. A listing that was boosted last week is not featured today, and must
 * neither keep the badge nor keep the paid position it bought.
 */

export type BoostTierValue = "none" | "featured" | "premium";

/** The minimum shape needed to judge a boost; Post satisfies it. */
export interface Boostable {
  boostTier: BoostTierValue;
  boostUntil: string | null;
}

/**
 * Is this listing currently holding a paid boost?
 *
 * `now` is injectable so the rule can be tested without faking the clock.
 * An unparseable or missing expiry counts as inactive: a boost we cannot date
 * is not one we can honestly advertise.
 */
export function isBoostActive(post: Boostable, now: number = Date.now()): boolean {
  if (post.boostTier === "none") return false;
  if (!post.boostUntil) return false;
  const until = Date.parse(post.boostUntil);
  if (Number.isNaN(until)) return false;
  return until > now;
}

/** Sort helper: boosted listings first, order otherwise untouched. */
export function boostedFirst<T extends Boostable>(a: T, b: T, now?: number): number {
  return Number(isBoostActive(b, now)) - Number(isBoostActive(a, now));
}
