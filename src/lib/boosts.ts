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

/** Extra shape needed to re-rank a feed: newest-first within a group. */
export interface Rankable extends Boostable {
  publishedAt: string | null;
}

/**
 * Order a feed the way it is actually sold: live boosts on top, everything
 * else newest first.
 *
 * This exists because ordering by the raw boost_until column cannot express
 * "boosts that have not expired". Postgres sorts a past timestamp above a null
 * unless told otherwise, so a listing whose boost ran out last week keeps
 * outranking every unboosted listing purely because its column is non-null.
 * The server has no way to say "treat an expired boost as no boost" through
 * PostgREST, so the final order is applied here instead.
 *
 * Within the boosted group the longest-running boost stays first, matching the
 * server's boost_until ordering; organic posts fall back to newest first.
 *
 * `limit` is applied after re-ranking so the caller's page size still holds.
 */
export function rankWithBoosts<T extends Rankable>(posts: T[], limit: number, now?: number): T[] {
  const at = now ?? Date.now();
  const time = (v: string | null): number => {
    if (!v) return 0;
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  };

  return [...posts]
    .sort((a, b) => {
      const aLive = isBoostActive(a, at);
      const bLive = isBoostActive(b, at);
      if (aLive !== bLive) return aLive ? -1 : 1;
      // Both boosted: longest remaining boost first, as the server ordered it.
      if (aLive) return time(b.boostUntil) - time(a.boostUntil);
      return time(b.publishedAt) - time(a.publishedAt);
    })
    .slice(0, limit);
}
