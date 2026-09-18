"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import { MiniMap } from "@/components/map/MiniMap";
import { ReviewsSection } from "@/components/visit/ReviewsSection";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { parseContact, parseLocation, waLink, telLink } from "@/lib/sponsors";
import type { Database } from "@/lib/database.types";
import type { MapPoint } from "@/lib/map/types";

type StayRow = Database["public"]["Tables"]["sponsors"]["Row"];

function Detail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [stay, setStay] = useState<StayRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      const c = getBrowserClient();
      if (!c) {
        setLoading(false);
        return;
      }
      const { data } = await c
        .from("sponsors")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();
      setStay((data ?? null) as StayRow | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <section className="py-20 text-center text-sm text-gray">Loading stay…</section>;
  }
  if (!stay) {
    return (
      <section className="py-20 px-4 text-center">
        <div className="text-lg font-extrabold text-navy mb-2">Stay not found</div>
        <p className="text-sm text-gray mb-5">It may have been unlisted.</p>
        <Link
          href="/visit/stays"
          className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold"
        >
          Back to Stays
        </Link>
      </section>
    );
  }

  const contact = parseContact(stay.contact);
  const loc = parseLocation(stay.location);
  const bookText = `Hello ${stay.name}, I found you on KLAGON Visit and would like to book a stay.`;
  const bookHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(bookText)}`
    : "#";
  const mapPoint: MapPoint | null =
    stay.latitude != null && stay.longitude != null
      ? {
          id: stay.id,
          entity_type: "stay",
          entity_id: null,
          name: stay.name,
          description: loc.address ?? null,
          category: stay.stay_type,
          latitude: Number(stay.latitude),
          longitude: Number(stay.longitude),
          community_area: loc.area ?? null,
          severity: null,
          icon: null,
          created_at: stay.created_at,
        }
      : null;

  return (
    <main className="w-full">
      <section className="bg-navy py-12 sm:py-14 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {stay.stay_type && (
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber mb-3">
              {stay.stay_type}
            </span>
          )}
          <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-white tracking-tight leading-tight mb-2">
            {stay.name}
          </h1>
          {stay.tagline && <p className="text-sm text-white/70">{stay.tagline}</p>}
        </div>
      </section>

      <section className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {stay.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {stay.photos.slice(0, 4).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={stay.name} className="w-full h-40 object-cover rounded-xl" loading="lazy" />
              ))}
            </div>
          ) : (
            <div className="h-40 rounded-2xl bg-pale flex items-center justify-center text-4xl">
              🛏️
            </div>
          )}

          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                {stay.price_range && (
                  <div className="text-xl font-extrabold text-navy">{stay.price_range}</div>
                )}
                {(stay.check_in || stay.check_out) && (
                  <div className="text-xs text-gray mt-1">
                    Check-in {stay.check_in ?? "—"} · Check-out {stay.check_out ?? "—"}
                  </div>
                )}
              </div>
              <a href={bookHref} target="_blank" rel="noopener noreferrer">
                <Button variant="primary">Book on WhatsApp →</Button>
              </a>
            </div>
            {stay.booking_note && (
              <p className="text-xs text-gray mt-3">{stay.booking_note}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {contact.phone && (
                <a href={telLink(contact.phone)} className="text-xs font-bold text-navy underline">
                  Call {contact.phone}
                </a>
              )}
              {loc.google_maps_url && (
                <a
                  href={loc.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-navy underline"
                >
                  Directions →
                </a>
              )}
            </div>
          </div>

          {stay.amenities.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="text-sm font-extrabold text-navy mb-2">Amenities</div>
              <div className="flex flex-wrap gap-1.5">
                {stay.amenities.map((a) => (
                  <span key={a} className="text-[11px] font-semibold px-2 py-1 rounded-full bg-pale text-navy">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stay.about && (
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="text-sm font-extrabold text-navy mb-2">About this stay</div>
              <p className="text-sm text-gray leading-relaxed whitespace-pre-wrap">{stay.about}</p>
            </div>
          )}

          {mapPoint && (
            <div className="rounded-2xl overflow-hidden border border-border">
              <MiniMap point={mapPoint} className="h-56 w-full" />
            </div>
          )}

          <ReviewsSection sponsorId={stay.id} />
        </div>
      </section>
    </main>
  );
}

export default function StayPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-sm text-gray">Loading stay…</div>}>
        <Detail />
      </Suspense>
      <Footer />
    </div>
  );
}
