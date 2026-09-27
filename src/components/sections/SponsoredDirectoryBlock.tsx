"use client";

import Link from "next/link";
import { MessageCircle, Phone, ArrowRight } from "lucide-react";
import { ORG_WA, waLink } from "@/lib/wa";
import { initialsOf } from "@/lib/directory";
import { recordAdClick, type SponsoredPlacement } from "@/lib/ads";
import { AdImpressionBoundary } from "@/components/ads/AdImpressionBoundary";

/** Where a paid directory placement is reported against. */
const DIRECTORY_AD_SLOT = "directory-sponsored" as const;

function telHref(tel: string) {
  return `tel:${tel.replace(/[^\d+]/g, "")}`;
}

/** Sponsors are paid, so a human-readable tier is part of what they bought. */
const TIER_LABELS: Record<string, string> = {
  community: "Community Partner",
  growth: "Growth Partner",
  talent: "Talent Partner",
  strategic: "Strategic Partner",
  founding: "Founding Partner",
  innovation: "Innovation Partner",
  skills: "Skills Partner",
  business: "Business Partner",
};

/**
 * Paying partners, shown as a clearly separated block above the organic
 * results.
 *
 * Sponsors are kept out of the organic grid on purpose: the 740 listings are
 * auto-imported and their ranking is reader-controlled (sort, search,
 * category), so a paid partner can never displace a better organic match or
 * be mistaken for one. They get guaranteed, labelled visibility above it.
 */
export function SponsoredDirectoryBlock({ sponsors }: { sponsors: SponsoredPlacement[] }) {
  if (sponsors.length === 0) return null;

  return (
    <section
      aria-labelledby="directory-sponsored-heading"
      data-testid="directory-sponsored"
      className="mb-8 rounded-2xl border-2 border-amber bg-amber/5 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber text-navy text-[10px] font-bold tracking-wide uppercase">
            Sponsored
          </span>
          <h2 id="directory-sponsored-heading" className="text-sm font-extrabold text-navy">
            Partners supporting Klagon
          </h2>
        </div>
        <Link
          href="/sponsors"
          className="text-[11px] font-bold text-blue hover:underline flex items-center gap-1"
        >
          Become a partner <ArrowRight size={12} />
        </Link>
      </div>

      <p className="text-[11px] text-gray mb-4">
        These businesses sponsor KLAGON. They are not ranked by the directory and never replace a search
        result — every listing below is shown on its own merits.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsors.map((s) => {
          // One handler for every exit, so the sponsor's click count reflects
          // real intent rather than whichever button happened to be used.
          const track = () =>
            recordAdClick(DIRECTORY_AD_SLOT, { sponsor: s.slug, partner: s.name, tier: s.tier });

          return (
            // Each card is its own placement: the shared slot keeps reporting
            // grouped, while the dedupe key credits this sponsor individually.
            <AdImpressionBoundary
              key={s.slug}
              slot={DIRECTORY_AD_SLOT}
              dedupeKey={`${DIRECTORY_AD_SLOT}:${s.slug}`}
              metadata={{ sponsor: s.slug, partner: s.name, tier: s.tier }}
            >
              <article className="h-full flex flex-col gap-2.5 bg-white rounded-2xl border border-amber/50 p-5 hover:border-amber hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white border border-border flex items-center justify-center text-navy flex-shrink-0 overflow-hidden">
                    {s.logoUrl ? (
                      // Logos come from sponsor-supplied URLs, so they bypass
                      // next/image's static allowlist and must stay plain.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-sm font-extrabold">{initialsOf(s.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-navy leading-snug">
                      <Link
                        href={`/business/${s.slug}`}
                        onClick={track}
                        className="hover:text-blue transition-colors"
                      >
                        {s.name}
                      </Link>
                    </h3>
                    {s.tagline && <p className="text-xs text-gray line-clamp-2 mt-1">{s.tagline}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {/* The block header already says Sponsored visually; this
                      repeats it for anyone reading a single card. */}
                  <span className="sr-only">Sponsored placement. </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber/20 text-navy text-[10px] font-bold">
                    {TIER_LABELS[s.tier] ?? s.tier}
                  </span>
                  {s.categories.slice(0, 2).map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-full bg-pale text-blue border border-blue/20 text-[10px] font-bold"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                  {s.whatsapp ? (
                    <a
                      href={waLink(s.whatsapp, `Hello, I found ${s.name} on the KLAGON business directory.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={track}
                      className="px-3 py-2 rounded-lg bg-navy text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-blue transition-colors"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  ) : (
                    // No WhatsApp on file, so route the reader to KLAGON
                    // rather than to a number that may not be on WhatsApp.
                    <a
                      href={waLink(ORG_WA, `Hello, I found ${s.name} on the KLAGON business directory.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-navy text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-blue transition-colors"
                    >
                      <MessageCircle size={13} /> Enquire
                    </a>
                  )}
                  {s.phone && (
                    <a
                      href={telHref(s.phone)}
                      onClick={track}
                      className="px-3 py-2 rounded-lg border border-navy text-navy text-[11px] font-bold flex items-center gap-1.5 hover:bg-pale transition-colors"
                    >
                      <Phone size={13} /> Call
                    </a>
                  )}
                  <Link
                    href={`/business/${s.slug}`}
                    onClick={track}
                    className="px-3 py-2 rounded-lg text-[11px] font-bold text-blue hover:underline flex items-center gap-1"
                  >
                    Profile <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            </AdImpressionBoundary>
          );
        })}
      </div>
    </section>
  );
}
