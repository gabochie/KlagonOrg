import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { fetchPublicSponsors } from "@/lib/sponsors";
import { sponsorScore } from "@/lib/sponsorCompleteness";

/**
 * Homepage "local businesses, picked by how complete they are".
 * The completeness score (src/lib/sponsorCompleteness.ts) is what earns a slot —
 * the more a profile shows (photos, prices, hours, contact, a claim), the more
 * it's surfaced. No manual curation needed; owners who complete their listing
 * rise automatically. Runs on the server, pure scoring, no guest round-trips.
 */
export async function BusinessHighlights() {
  const sponsors = await fetchPublicSponsors();
  const ranked = sponsors
    .map((s) => ({ s, score: sponsorScore(s) }))
    .sort((a, b) => b.score.total - a.score.total)
    .filter((x) => x.score.total > 0)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-2">
              Klagon Businesses
            </div>
            <h2 className="text-[clamp(1.4rem,2.4vw,1.9rem)] font-extrabold text-navy tracking-tight leading-tight">
              The most complete businesses in Klagon, today.
            </h2>
            <p className="text-sm text-gray mt-1.5 max-w-lg">
              Ranked by how much of their listing is real — photos, prices, hours,
              contact, and a verified claim. Complete yours to take the top slots.
            </p>
          </div>
          <Link
            href="/sponsor/wall"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-navy underline"
          >
            All partners <ArrowRight size="13" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ranked.map(({ s, score }, i) => (
            <Link
              key={s.id}
              href={`/business/${s.slug}`}
              className="group bg-light rounded-2xl border border-border p-5 hover:border-navy hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden flex-shrink-0 text-base font-extrabold text-navy">
                  {s.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.logo_url} alt={`${s.name} logo`} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    "#" + (i + 1)
                  )}
                </div>
                {s.claimed_by && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                    <BadgeCheck size="11" /> Claimed
                  </span>
                )}
              </div>
              <h3 className="text-sm font-extrabold text-navy tracking-tight leading-tight mb-0.5">
                {s.name}
              </h3>
              {s.tagline && <p className="text-xs text-gray line-clamp-2 mb-3">{s.tagline}</p>}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray mb-1">
                  <span>Profile completeness</span>
                  <span>{score.total}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber transition-all"
                    style={{ width: `${score.total}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
