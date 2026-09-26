import Link from "next/link";

// End-of-article conversion block for blog posts: the reader just received
// value — route them to their natural next action (give, join, learn).
export function ArticleCta() {
  return (
    <div className="mt-8 rounded-xl bg-navy p-5 sm:p-6">
      <div className="text-sm font-extrabold text-white mb-1">
        This story was made possible by people like you.
      </div>
      <p className="text-xs text-white/60 leading-relaxed mb-4">
        KLAGON.org runs on community gifts and volunteers — no paywalls, no
        shareholders. Fuel the next story, course, or opportunity.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/donate"
          className="px-4 py-2 rounded-lg bg-amber text-navy text-xs font-bold hover:bg-white transition-colors"
        >
          Donate →
        </Link>
        <Link
          href="/volunteer"
          className="px-4 py-2 rounded-lg border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-colors"
        >
          Volunteer
        </Link>
        <Link
          href="/learning"
          className="px-4 py-2 rounded-lg border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-colors"
        >
          Keep learning
        </Link>
      </div>
    </div>
  );
}
