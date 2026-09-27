/**
 * Build-time route enumeration for `output: export`.
 *
 * klagon.org ships as a static export, so Next calls generateStaticParams for
 * every dynamic route at build time. Two hard constraints follow:
 *
 *  1. An empty array is fatal. If a route hands Next zero params, the whole
 *     build dies with "Page ... is missing generateStaticParams()".
 *  2. Supabase is not reliably reachable from a build host — requests here have
 *     been observed failing intermittently, per-table, within a single build.
 *
 * So every Supabase-backed route resolves its keys through resolveStaticKeys():
 * retry the live query, then fall back to a committed snapshot in src/data
 * (refresh with `node scripts/refresh-static-snapshots.cjs`), and only throw a
 * descriptive error if both are exhausted. Snapshots are a build-safety net
 * only — normal builds use live data, so new rows appear without a refresh.
 */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveStaticKeys(
  route: string,
  query: () => Promise<string[]>,
  snapshot: readonly string[]
): Promise<string[]> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const keys = (await query()).filter(Boolean);
      if (keys.length > 0) return keys;
    } catch {
      if (attempt === MAX_ATTEMPTS) break;
    }
    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
  }

  if (snapshot.length > 0) {
    console.warn(
      `[static-params] ${route}: live query unavailable after ${MAX_ATTEMPTS} attempts — using snapshot (${snapshot.length}).`
    );
    return [...snapshot];
  }

  throw new Error(
    `[static-params] ${route}: no build-time params available. Check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, then run \`node scripts/refresh-static-snapshots.cjs\`.`
  );
}
