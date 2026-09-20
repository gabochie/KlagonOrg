import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, Navigation, Map as MapIcon, BadgeCheck, Flag, Send } from "lucide-react";
import type { MapPoint } from "@/lib/map/types";
import { SEVERITY_META } from "@/lib/map/types";
import { entityTypeLabel, layerForType } from "@/lib/map/layers";
import { ORG_WA, waLink } from "@/lib/wa";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors cursor-pointer font-sans";

function layerHref(point: MapPoint): { href: string; label: string } | null {
  if (point.entity_type === "project") return { href: "/projects", label: "Projects" };
  if (point.entity_type === "event") return { href: "/events", label: "Events" };
  if (point.entity_type === "stay") return { href: "/visit/stays", label: "Places to stay" };
  return null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray">{label}</div>
      <div className="text-sm font-semibold text-navy text-right break-words">{value}</div>
    </div>
  );
}

export function MapPlaceContent({ point: p, slug }: { point: MapPoint; slug: string }) {
  const layer = layerForType(p.entity_type);
  const isNeed = p.entity_type === "need";
  const linked = layerHref(p);
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
  const reportHref = waLink(
    ORG_WA,
    isNeed
      ? `Hi KlagonOrg! I'd like to update/mark progress on the reported need: ${p.name} (${p.id} · ${p.community_area ?? "Klagon"}).`
      : `Hi KlagonOrg! I'd like to update the info for ${p.name} (${p.id} · ${p.community_area ?? "Klagon"}) on the Klagon map.`,
  );

  return (
    <main className="w-full">
      <section className="bg-navy relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-amber/8 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 relative">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size="14" /> Back to the map
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl border border-white/15 flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${layer?.color ?? "#64748B"}33` }}
            >
              {p.icon ?? layer?.icon ?? <MapPin size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {layer && (
                  <span
                    className="px-2.5 py-1 rounded-full text-white text-[10px] font-bold tracking-wide uppercase"
                    style={{ backgroundColor: layer.color }}
                  >
                    {layer.icon} {layer.label}
                  </span>
                )}
                {isNeed && p.severity && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-[10px] font-bold"
                    style={{ backgroundColor: SEVERITY_META[p.severity]?.color ?? "#DC2626" }}
                  >
                    {SEVERITY_META[p.severity]?.emoji} {SEVERITY_META[p.severity]?.label} need
                  </span>
                )}
              </div>
              <h1 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold text-white tracking-tight leading-tight">
                {p.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                {(p.category || p.community_area) && (
                  <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                    <MapPin size="13" className="text-amber" />
                    {[p.category, p.community_area].filter(Boolean).join(" · ")}
                  </span>
                )}
                {!isNeed && (
                  <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                    <MapIcon size="13" className="text-amber" />
                    {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-7">
            <Link href={`/map?point=${p.id}`} className={`${btn} bg-amber text-navy hover:bg-amber-strong hover:text-white`}>
              <MapIcon size="16" /> Open on the map
            </Link>
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={`${btn} bg-white text-navy hover:bg-white/90`}>
              <Navigation size="16" /> Directions
            </a>
            {linked && (
              <Link href={linked.href} className={`${btn} bg-white/10 text-white border border-white/20 hover:bg-white/20`}>
                {linked.label} →
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-extrabold text-navy tracking-tight mb-3">
            {isNeed ? "Reported need" : "About this place"}
          </h2>
          {p.description || isNeed ? (
            <p className="text-sm text-gray leading-relaxed mb-4">
              {p.description ?? "A community-reported need awaiting description and progress updates."}
            </p>
          ) : (
            <p className="text-sm text-gray leading-relaxed mb-4">
              This {layer?.label.toLowerCase() ?? "place"} is mapped on KLAGON.org. Add its hours, contacts or a short
              description and we&apos;ll publish them here.
            </p>
          )}
          {p.entity_id && (
            <p className="text-[11px] text-gray mb-4">
              Linked to community record <span className="font-semibold text-navy">{p.entity_id}</span>.
            </p>
          )}
          <div className="bg-white rounded-2xl border border-border px-5 py-2">
            <InfoRow label="Category" value={p.category ?? entityTypeLabel(p.entity_type)} />
            {p.community_area && <InfoRow label="Area" value={p.community_area} />}
            {!isNeed && <InfoRow label="Coordinates" value={`${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`} />}
            {isNeed && p.severity && <InfoRow label="Severity" value={`${SEVERITY_META[p.severity]?.emoji} ${SEVERITY_META[p.severity]?.label}`} />}
            <InfoRow label="Map ID" value={p.id.split("-")[0]} />
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-navy rounded-2xl px-6 py-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-amber mb-2">
              {isNeed ? <Flag size="14" /> : <BadgeCheck size="14" />} Know more?
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">
              {isNeed ? "Report progress on this need." : "Help keep this place accurate."}
            </h2>
            <p className="text-white/70 text-sm mb-5">
              {isNeed
                ? "Tell us what has changed so we can update the community on Klagon."
                : "Send corrections, hours or a short note — a real person verifies before it goes public."}
            </p>
            <a
              href={reportHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} w-full bg-amber text-navy hover:bg-amber-strong hover:text-white`}
            >
              <MessageCircle size="16" /> Report on WhatsApp
            </a>
            <a
              href={waLink(ORG_WA, "Hi KlagonOrg! Please add a new place to the Klagon map.")}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} w-full bg-white/10 text-white border border-white/20 hover:bg-white/20 mt-2.5`}
            >
              <Send size="16" /> Add a place
            </a>
            <p className="mt-4 text-[11px] text-white/50">
              Public page · <span className="font-mono">{slug}</span>
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}