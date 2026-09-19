import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Star,
  BadgeCheck,
  Clock,
  Tag,
  Navigation,
  ChevronRight,
} from "lucide-react";
import type { DirectoryBusiness } from "@/lib/directory";
import { initialsOf, waHref, telHref } from "@/lib/directory";
import { DirectoryClaimPanel } from "@/components/sections/DirectoryClaimPanel";

function Stars({ rating, reviews }: { rating: number; reviews: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber font-bold text-sm">
      <span className="inline-flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size="14"
            className={i < Math.round(rating) ? "text-amber" : "text-white/25"}
            fill="currentColor"
          />
        ))}
      </span>
      {rating.toFixed(1)}
      {reviews != null && <span className="text-white/60 font-semibold">({reviews})</span>}
    </span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="mt-0.5 text-navy/40 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gray">{label}</div>
        <div className="text-sm font-semibold text-navy break-words">{value}</div>
      </div>
    </div>
  );
}

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors cursor-pointer font-sans";

export function DirectoryProfileContent({
  business: b,
  related,
}: {
  business: DirectoryBusiness;
  related: DirectoryBusiness[];
}) {
  return (
    <main className="w-full">
      <section className="bg-navy relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-amber/8 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 relative">
          <Link
            href="/business"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size="14" /> Back to the directory
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0">
              {initialsOf(b.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-amber text-navy text-[10px] font-bold tracking-wide uppercase">
                  {b.category}
                </span>
                {b.verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green text-white text-[10px] font-bold">
                    <BadgeCheck size="12" /> Verified
                  </span>
                ) : b.phoneVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold">
                    ✓ Phone on record
                  </span>
                ) : null}
              </div>
              <h1 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-white tracking-tight leading-tight">
                {b.name}
              </h1>
              {b.title && <p className="text-white/70 text-sm mt-1.5">{b.title}</p>}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                  <MapPin size="13" className="text-amber" /> {b.area}
                </span>
                {b.rating != null && <Stars rating={b.rating} reviews={b.reviews} />}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-7">
            {b.wa && (
              <a
                href={waHref(b.wa, b.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} bg-amber text-navy hover:bg-amber-strong hover:text-white`}
              >
                <MessageCircle size="16" /> WhatsApp
              </a>
            )}
            {b.tel && (
              <a href={telHref(b.tel)} className={`${btn} bg-white text-navy hover:bg-white/90`}>
                <Phone size="16" /> Call
              </a>
            )}
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} bg-white/10 text-white border border-white/20 hover:bg-white/20`}
              >
                <Globe size="16" /> Website
              </a>
            )}
            {b.maps && (
              <a
                href={b.maps}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn} bg-white/10 text-white border border-white/20 hover:bg-white/20`}
              >
                <Navigation size="16" /> Directions
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-extrabold text-navy tracking-tight mb-2">Business details</h2>
          <p className="text-sm text-gray mb-4">
            This listing is compiled from Klagon&apos;s public business registry and the Google Maps census. It stays
            basic until the owner claims it.
          </p>
          <div className="bg-white rounded-2xl border border-border px-5 py-2">
            {b.phone && <InfoRow icon={<Phone size="15" />} label="Phone" value={b.phone} />}
            {b.wa && (
              <InfoRow
                icon={<MessageCircle size="15" />}
                label="WhatsApp"
                value={
                  <a
                    href={waHref(b.wa, b.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue hover:underline"
                  >
                    Message on WhatsApp
                  </a>
                }
              />
            )}
            <InfoRow icon={<MapPin size="15" />} label="Area" value={b.area} />
            {b.hours && <InfoRow icon={<Clock size="15" />} label="Hours" value={b.hours} />}
            {b.price && <InfoRow icon={<Tag size="15" />} label="Price range" value={b.price} />}
            <InfoRow icon={<Tag size="15" />} label="Category" value={b.category} />
            {b.website && (
              <InfoRow
                icon={<Globe size="15" />}
                label="Website"
                value={
                  <a
                    href={b.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue hover:underline break-all"
                  >
                    {b.website}
                  </a>
                }
              />
            )}
            {b.maps && (
              <InfoRow
                icon={<Navigation size="15" />}
                label="Location"
                value={
                  <a
                    href={b.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue hover:underline"
                  >
                    Open in Google Maps
                  </a>
                }
              />
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <DirectoryClaimPanel business={b} />
        </aside>
      </section>

      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
          <h2 className="text-lg font-extrabold text-navy tracking-tight mb-4">
            More in {b.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/directory/${r.slug}`}
                className="group flex items-center gap-3 bg-white rounded-2xl border border-border p-4 hover:border-navy/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-pale border border-border flex items-center justify-center text-xs font-extrabold text-navy flex-shrink-0">
                  {initialsOf(r.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-navy leading-snug truncate">{r.name}</div>
                  <div className="text-[11px] text-gray truncate">{r.area}</div>
                </div>
                <ChevronRight size="16" className="text-gray group-hover:text-navy transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
          <Link
            href="/business"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:text-blue transition-colors mt-6"
          >
            <ArrowLeft size="15" /> Browse all 740 businesses
          </Link>
        </section>
      )}
    </main>
  );
}
