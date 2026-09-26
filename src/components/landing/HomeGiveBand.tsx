import Link from "next/link";

// Slim money band directly under the hero: the first thing after the pitch
// is the ask. Page-matched links route each visitor to their natural action.
export function HomeGiveBand() {
  return (
    <section className="bg-amber px-4 sm:px-6 py-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <p className="flex-1 text-center sm:text-left text-sm font-extrabold text-navy leading-snug">
          Keep Klagon online — GH₵20/mo covers a learner&apos;s data.{" "}
          <Link href="/impact" className="underline underline-offset-2 hover:text-blue">
            See the proof
          </Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/donate"
            className="px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:bg-blue transition-colors"
          >
            Donate →
          </Link>
          <Link
            href="/sponsor"
            className="px-4 py-2 rounded-lg border border-navy/25 text-navy text-xs font-bold hover:border-navy transition-colors"
          >
            Sponsor
          </Link>
        </div>
      </div>
    </section>
  );
}
