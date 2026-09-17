import Link from "next/link";
import { BadgeCheck, MapPin, Clock, Award, ShieldCheck, Globe, Mail, Phone, Star, ArrowRight } from "lucide-react";
import { fetchPublicSponsorBySlug, fetchSponsorBadges, parseContact, parseLocation } from "@/lib/sponsors";
import { BADGE_LABELS, WALL_GROUPS } from "@/lib/constants";
import { TierBadge } from "@/components/sponsor/TierBadge";
import { ProfileActions } from "@/components/sponsor/ProfileActions";

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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="text-sm font-extrabold text-navy mb-4">{title}</h3>
      {children}
    </div>
  );
}

function WallLabel({ wall }: { wall: string | null }) {
  if (!wall) return null;
  const group = WALL_GROUPS.find((w) => w.id === wall);
  if (!group) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pale text-blue text-[11px] font-bold border border-blue/20">
      <Star size="11" />
      {group.label}
    </span>
  );
}

export async function SponsorProfileContent({ slug }: { slug: string }) {
  const sponsor = await fetchPublicSponsorBySlug(slug);

  if (!sponsor) {
    return (
      <main className="w-full">
        <section className="bg-light py-20 px-4 text-center">
          <div className="text-lg font-extrabold text-navy mb-2">Business not found</div>
          <p className="text-sm text-gray mb-5">
            This business profile is unavailable, or it has left the KLAGON partnership programme.
          </p>
          <Link
            href="/sponsors"
            className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
          >
            View the Sponsor Wall
          </Link>
        </section>
      </main>
    );
  }

  const badges = await fetchSponsorBadges(sponsor.id);
  const contact = parseContact(sponsor.contact);
  const location = parseLocation(sponsor.location);
  const hasContact = !!(contact.phone || contact.email || contact.website);
  const showsStudio = ["growth", "talent", "digital", "strategic"].includes(sponsor.tier);

  return (
    <main className="w-full">
      <section className="relative">
        <div className="h-44 sm:h-56 w-full bg-gradient-to-br from-navy via-blue to-coral" />
        {sponsor.cover_url ? (
          <img
            src={sponsor.cover_url}
            alt={`${sponsor.name} cover`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 pb-16 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center text-2xl font-extrabold text-navy flex-shrink-0 overflow-hidden">
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-2" />
            ) : (
              <span>{initialsOf(sponsor.name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                {sponsor.name}
              </h1>
              {sponsor.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber text-navy text-[11px] font-bold">
                  <Star size="11" fill="currentColor" />
                  Featured Business
                </span>
              )}
            </div>
            {sponsor.tagline && (
              <p className="text-sm text-gray mb-3">{sponsor.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={sponsor.tier} />
              <WallLabel wall={sponsor.wall_group} />
              {badges.map((b) => (
                <span
                  key={b.tier_type}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-[11px] font-bold border border-emerald/30"
                >
                  <BadgeCheck size="11" />
                  {BADGE_LABELS[b.tier_type] ?? "Verified"}
                </span>
              ))}
            </div>
          </div>
        </div>

        {(sponsor.categories?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {sponsor.categories.map((c) => (
              <span
                key={c}
                className="px-3 py-1 rounded-full bg-pale text-blue border border-blue/20 text-xs font-bold"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 flex flex-col gap-5">
            {sponsor.about && (
              <Section title="About">
                <p className="text-sm text-gray leading-relaxed whitespace-pre-line">{sponsor.about}</p>
              </Section>
            )}
            {sponsor.why_supports && (
              <Section title="Why this company supports KLAGON">
                <p className="text-sm text-gray leading-relaxed bg-light rounded-xl p-4 border border-border">
                  {sponsor.why_supports}
                </p>
              </Section>
            )}
            {(sponsor.products_services?.length ?? 0) > 0 && (
              <Section title="Products & Services">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sponsor.products_services.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 text-sm text-navy bg-light rounded-lg px-3 py-2.5 border border-border"
                    >
                      <span className="text-amber mt-0.5">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {(sponsor.certifications?.length ?? 0) > 0 && (
              <Section title="Certifications & Memberships">
                <ul className="flex flex-col gap-2">
                  {sponsor.certifications.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-navy">
                      <Award size="16" className="text-amber flex-shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {(hasContact || contact.whatsapp) && (
              <Section title="Contact">
                <div className="flex flex-col gap-3">
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hello ${sponsor.name}, I found you via KLAGON.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-navy hover:text-blue transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center flex-shrink-0">
                        <BadgeCheck size="16" />
                      </span>
                      WhatsApp
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone.replace(/\D/g, "")}`} className="flex items-center gap-2.5 text-sm text-navy hover:text-blue transition-colors">
                      <span className="w-8 h-8 rounded-lg bg-pale text-blue flex items-center justify-center flex-shrink-0">
                        <Phone size="16" />
                      </span>
                      {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm text-navy hover:text-blue transition-colors break-all">
                      <span className="w-8 h-8 rounded-lg bg-pale text-blue flex items-center justify-center flex-shrink-0">
                        <Mail size="16" />
                      </span>
                      {contact.email}
                    </a>
                  )}
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-navy hover:text-blue transition-colors break-all">
                      <span className="w-8 h-8 rounded-lg bg-pale text-blue flex items-center justify-center flex-shrink-0">
                        <Globe size="16" />
                      </span>
                      {contact.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </Section>
            )}

            <Section title="Visit & Open Hours">
              <div className="flex flex-col gap-3 text-sm text-navy">
                {location.area && (
                  <div className="flex items-start gap-2.5">
                    <MapPin size="16" className="text-amber flex-shrink-0 mt-0.5" />
                    <span>{location.area}</span>
                  </div>
                )}
                {location.address && <div className="text-xs text-gray pl-[26px]">{location.address}</div>}
                {sponsor.opening_hours && (
                  <div className="flex items-start gap-2.5">
                    <Clock size="16" className="text-amber flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{sponsor.opening_hours}</span>
                  </div>
                )}
                {(sponsor.service_areas?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sponsor.service_areas.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-light border border-border text-[10px] font-bold text-gray">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {location.google_maps_url && (
                  <a
                    href={location.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue pt-1"
                  >
                    <MapPin size="12" /> Get directions
                  </a>
                )}
              </div>
            </Section>

            <ProfileActions whatsapp={contact.whatsapp} businessName={sponsor.name ?? ""} />

            {showsStudio && (
              <div className="bg-gradient-to-br from-navy to-blue rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size="18" className="text-amber" />
                  <h3 className="text-sm font-extrabold">Need a full website?</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  KLAGON Business Studio builds modern, mobile-friendly websites for businesses in
                  Klagon and beyond.
                </p>
                <Link
                  href="/sponsor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber text-navy text-xs font-bold hover:bg-amber/90 transition-colors"
                >
                  Get a website <ArrowRight size="13" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray text-center">
          <Link href="/sponsors" className="font-bold text-blue hover:underline">
            Sponsor Wall
          </Link>{" "}
          · This profile is powered by the KLAGON partnership programme.
        </p>
      </section>
    </main>
  );
}