import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { fetchPublicSponsors, parseContact } from "@/lib/sponsors";
import type { SponsorRow } from "@/lib/sponsors";
import { WALL_GROUPS } from "@/lib/constants";
import { TierBadge } from "@/components/sponsor/TierBadge";

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function SponsorCard({ sponsor }: { sponsor: SponsorRow }) {
  const contact = parseContact(sponsor.contact);
  return (
    <Link
      href={`/business/${sponsor.slug}`}
      className="group flex flex-col gap-3 bg-white rounded-2xl border border-border p-5 hover:border-amber hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-pale border border-border flex items-center justify-center text-sm font-extrabold text-navy overflow-hidden flex-shrink-0">
          {sponsor.logo_url ? (
            <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-1.5" />
          ) : (
            initialsOf(sponsor.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-extrabold text-navy truncate group-hover:text-blue transition-colors">
              {sponsor.name}
            </h3>
          </div>
          {sponsor.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber text-navy text-[10px] font-bold mb-1">
              ★ Featured
            </span>
          )}
          {sponsor.tagline && (
            <p className="text-xs text-gray line-clamp-2">{sponsor.tagline}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TierBadge tier={sponsor.tier} />
        {sponsor.categories.slice(0, 2).map((c) => (
          <span key={c} className="px-2 py-0.5 rounded-full bg-pale text-blue border border-blue/20 text-[10px] font-bold">
            {c}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue mt-auto pt-1">
        <span>View profile</span>
        <ArrowRight size="12" className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

export async function SponsorWallContent() {
  const sponsors = await fetchPublicSponsors();

  const getWallGroup = (s: SponsorRow): string => {
    if (s.wall_group) return s.wall_group;
    const match = WALL_GROUPS.find((g) => g.defaultTiers.includes(s.tier));
    return match?.id ?? "community";
  };

  const grouped = WALL_GROUPS.map((g) => ({
    ...g,
    sponsors: sponsors.filter((s) => getWallGroup(s) === g.id),
  }));

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">Our Partners</div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            The businesses building Klagon&apos;s future.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Every partner on this wall is a verified KLAGON sponsor — investing in youth, jobs, and innovation.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col gap-12">
          {grouped.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2.5 mb-5">
                <ShieldCheck size="20" className="text-amber flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-extrabold text-navy">{group.label}</h2>
                  <p className="text-xs text-gray">{group.description}</p>
                </div>
              </div>
              {group.sponsors.length === 0 ? (
                <p className="text-sm text-gray bg-light rounded-2xl p-6 text-center border border-border italic">
                  No partners in this group yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.sponsors.map((s) => (
                    <SponsorCard key={s.id} sponsor={s} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/sponsor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
          >
            Become a partner <ArrowRight size="14" />
          </Link>
        </div>
      </section>
    </main>
  );
}