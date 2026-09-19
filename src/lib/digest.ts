/**
 * Owner digest engine — pure kernel + data fetchers.
 *
 * Retention loop: business owners and authors periodically hear what their
 * listings earned (views, reviews, replies needed). Delivery is zero-cost
 * WhatsApp via wa.me links built here; the app never sends blind bulk.
 *
 * Pure message building. Deterministic. Fully unit-tested.
 */

export interface SponsorDigestStats {
  businessName: string;
  reviewsTotal: number;
  reviewsAvg: number | null;
  unrepliedCount: number;
  photosCount: number;
}

export interface AuthorDigestStats {
  displayName: string;
  approvedPosts: number;
  totalViews: number;
  pendingPosts: number;
}

export function buildSponsorDigest(s: SponsorDigestStats): string {
  const lines = [`Hello ${s.businessName} — your KLAGON weekly update.`];
  if (s.reviewsTotal === 0) {
    lines.push("No reviews yet. Ask a happy customer to review you — it takes them a minute: your profile has the review form built in.");
  } else {
    const avg = s.reviewsAvg != null ? `${s.reviewsAvg}/5 from ${s.reviewsTotal} review${s.reviewsTotal === 1 ? "" : "s"}` : `${s.reviewsTotal} reviews`;
    lines.push(`You have ${avg}.`);
  }
  if (s.unrepliedCount > 0) {
    lines.push(`${s.unrepliedCount} review${s.unrepliedCount === 1 ? " needs" : "s need"} your public reply — replies turn readers into customers.`);
  }
  if (s.photosCount === 0) {
    lines.push("Tip: listings with photos get far more taps. Send us 3 photos on WhatsApp and we will add them.");
  }
  lines.push("— Team KLAGON. Reply STOP to opt out.");
  return lines.join(" ");
}

export function buildAuthorDigest(s: AuthorDigestStats): string {
  const lines = [`Hello ${s.displayName} — your KLAGON week.`];
  lines.push(
    s.approvedPosts === 0
      ? "Your posts are still in review. Once approved, every view lands here."
      : `${s.approvedPosts} approved post${s.approvedPosts === 1 ? "" : "s"} with ${s.totalViews} total view${s.totalViews === 1 ? "" : "s"}.`
  );
  if (s.pendingPosts > 0) {
    lines.push(`${s.pendingPosts} still in review — usually cleared within a day.`);
  }
  lines.push("Keep sharing: 5 approvals earn the verified tick. — Team KLAGON. Reply STOP to opt out.");
  return lines.join(" ");
}

export function buildDigestLink(phone: string, message: string): string {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) digits = "233" + digits.slice(1);
  else if (digits.length === 9) digits = "233" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
