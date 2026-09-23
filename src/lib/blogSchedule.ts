export const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Publishing gate. A valid YYYY-MM-DD `date` is required for every post
 * (keeps non-article clutter like README.md out of the feed). Posts are
 * otherwise visible by default — the existing pre-dated backlog stays live.
 * A post becomes time-gated only when its frontmatter has `status: scheduled`:
 * it stays hidden until its `date` arrives. The daily publish workflow rebuilds
 * + redeploys, so a scheduled post surfaces automatically on its date.
 */
export function isPostPublished(p: { status?: string; date?: string }): boolean {
  const date = (p.date ?? "").trim();
  if (!ISO_DAY_RE.test(date)) return false;
  if (p.status === "scheduled") {
    return date <= todayIso();
  }
  return true;
}