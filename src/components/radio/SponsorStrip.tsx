import { fetchPublicSponsors, parseContact } from "@/lib/sponsors";
import { TrackLink } from "@/components/radio/TrackLink";
import { AdImpressionBoundary } from "@/components/ads/AdImpressionBoundary";
import type { AdSlot } from "@/lib/ads";

/**
 * First-party advertising inventory: the businesses already backing KLAGON.
 *
 * This is the inventory we can actually sell in Klagon — a sponsor's name and
 * message reaching a captive, local audience. It renders nothing when there are
 * no active sponsors, so the page never shows an empty "sponsored by" header.
 *
 * Stays a server component so the sponsor list is prerendered into the static
 * HTML; viewability and clicks are attached by the two small client wrappers.
 */
export async function SponsorStrip({ slot = "sponsors-wall" }: { slot?: AdSlot }) {
  const sponsors = await fetchPublicSponsors();
  if (!sponsors.length) return null;

  const featured = sponsors.slice(0, 6);

  return (
    <section className="bg-white py-12 sm:py-14 px-4 sm:px-6 border-t border-border">
      <AdImpressionBoundary slot={slot} className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-navy tracking-tight">
              Businesses keeping Klagon on air
            </h2>
            <p className="text-xs text-gray mt-1">
              Every sponsor below funds free data and power for the station.
            </p>
          </div>
          <TrackLink
            href="/sponsor"
            source="radio"
            action="sponsor-strip-cta"
            className="text-xs font-bold text-navy underline hover:text-amber-strong"
          >
            Advertise on Klagon Radio →
          </TrackLink>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {featured.map((s) => {
            const website = parseContact(s.contact).website;
            const href = website ?? "/sponsors";
            return (
              <li key={s.id}>
                <TrackLink
                  href={href}
                  source="radio"
                  action="sponsor-click"
                  adSlot={slot}
                  metadata={{ sponsor: s.slug, tier: s.tier }}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-border p-4 transition hover:border-amber hover:shadow-md"
                >
                  {s.logo_url ? (
                    // Remote sponsor logos; next/image is unavailable under
                    // output: export without a remote pattern config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logo_url}
                      alt={s.name}
                      className="h-10 w-10 rounded-lg object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-sm font-extrabold text-amber">
                      {s.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs font-extrabold text-navy leading-snug">{s.name}</span>
                  {s.tagline ? (
                    <span className="text-[11px] text-gray leading-snug line-clamp-2">
                      {s.tagline}
                    </span>
                  ) : null}
                </TrackLink>
              </li>
            );
          })}
        </ul>
      </AdImpressionBoundary>
    </section>
  );
}
