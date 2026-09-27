import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import { CasterPlayer } from "@/components/radio/CasterPlayer";
import { OnAirNow } from "@/components/radio/OnAirNow";
import { SponsorStrip } from "@/components/radio/SponsorStrip";
import { TrackLink } from "@/components/radio/TrackLink";
import { AdSlot } from "@/components/ads/AdSlot";
import { RADIO_SHOWS, onAirWindowLabel } from "@/lib/radioSchedule";

export const metadata: Metadata = {
  title: "Klagon Radio — KLAGON.org",
  description: `Klagon's community radio station. News, markets, schools and sport, on air daily ${onAirWindowLabel()} GMT. Press play, no app, no login.`,
  alternates: { canonical: "/radio" },
};

const STUDIO_PHONE = "+233243262019";
const STUDIO_PHONE_HUMAN = "+233 24 326 2019";
const STUDIO_WHATSAPP = "https://wa.me/233268708895";
const STATION_SITE = "https://klagon-radio.ismyradio.com";

/**
 * First-party house ad. Fills a reserved advertising slot until a paid ad unit
 * is configured, so the slot is never a blank hole in the page.
 */
function HouseAd({ placement, title, body }: { placement: string; title: string; body: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-pale p-4">
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray/70">
          Sponsored slot
        </div>
        <div className="text-sm font-extrabold text-navy">{title}</div>
        <p className="text-xs text-gray">{body}</p>
      </div>
      <TrackLink
        href="/sponsor"
        source="radio"
        action="house-ad-click"
        metadata={{ placement }}
        className="shrink-0"
      >
        <Button variant="outline" size="sm">
          Claim this slot
        </Button>
      </TrackLink>
    </div>
  );
}

export default function RadioPage() {
  return (
    <div className="w-full" style={{ overflowX: "clip" }}>
      <Navbar />

      {/*
        The player bar is the single mount point for the Caster.fm widget and
        sticks for the whole page, so a listener keeps the stream (and the
        donate button beside it) in view while reading the sections below.
        `overflow-x: clip` is deliberate: `overflow: hidden` would create a
        scroll container and break position: sticky.
      */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 md:flex-1">
            <CasterPlayer />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            <OnAirNow />
            <TrackLink
              href="/donate"
              source="radio"
              action="donate-click"
              metadata={{ placement: "player-bar" }}
            >
              <Button variant="primary" size="sm">
                ♥ Keep us on air
              </Button>
            </TrackLink>
          </div>
        </div>
      </div>

      <main className="w-full">
        <section className="bg-navy pt-12 pb-14 sm:pt-16 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon · On air daily {onAirWindowLabel()} GMT · Free
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              📻 Klagon Radio
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Hyper-local talk for Klagon — news, markets, schools, sports. No app,
              no login, press play. Requests on WhatsApp{" "}
              <a href={STUDIO_WHATSAPP} className="underline text-amber">
                +233 26 870 8895
              </a>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <TrackLink
                href="/donate"
                source="radio"
                action="donate-click"
                metadata={{ placement: "hero" }}
              >
                <Button variant="primary">♥ Keep Klagon On Air — Donate</Button>
              </TrackLink>
              <TrackLink
                href="/sponsor"
                source="radio"
                action="sponsor-cta"
                metadata={{ placement: "hero" }}
              >
                <Button variant="dark">📣 Sponsor a show</Button>
              </TrackLink>
            </div>

            <p className="text-white/50 text-xs mt-4 max-w-md mx-auto">
              Silence? We&apos;re off-air and the studio PC is asleep — back{" "}
              {RADIO_SHOWS[0].sponsorSlot.split("–")[0]} GMT. The stream is free, no
              data bundle needed.
            </p>
          </div>
        </section>

        <section className="bg-pale py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RADIO_TOP}
              label="radio-top"
              houseAd={
                <HouseAd
                  placement="radio-top"
                  title="Reach every trader, teacher and trader-driver in Klagon"
                  body="One 96k stream, no app, no login. Sponsorships from GH₵20 a day."
                />
              }
            />
          </div>
        </section>

        <SponsorStrip />

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy mb-1">
              Sponsor a show — your name on air
            </h2>
            <p className="text-xs text-gray mb-5">
              {RADIO_SHOWS.length} daily shows, {RADIO_SHOWS.length} sponsorship slots. GH₵20/mo
              keeps a learner online — show sponsors keep the whole station on. Call
              to claim a show.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RADIO_SHOWS.map((d) => (
                <div key={d.id} className="border border-border rounded-2xl p-6">
                  <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-1">
                    {d.sponsorSlot} GMT
                  </div>
                  <div className="text-sm font-extrabold text-navy mb-1">{d.title}</div>
                  <p className="text-xs text-gray leading-relaxed mb-3">{d.desc}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <TrackLink
                      href="/sponsor"
                      source="radio"
                      action="sponsor-show-click"
                      metadata={{ show: d.id, slot: d.sponsorSlot }}
                      className="text-xs font-bold text-navy underline hover:text-amber-strong"
                    >
                      {d.cta} →
                    </TrackLink>
                    <TrackLink
                      href={`tel:${STUDIO_PHONE}`}
                      source="radio"
                      action="sponsor-call-click"
                      metadata={{ show: d.id }}
                      className="text-xs font-bold text-gray underline hover:text-navy"
                    >
                      Call {STUDIO_PHONE_HUMAN}
                    </TrackLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white pb-14 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RADIO_MID}
              label="radio-mid"
              className="rounded-2xl border border-border p-4"
              houseAd={
                <HouseAd
                  placement="radio-mid"
                  title="This space is for Klagon businesses"
                  body="Reach listeners who keep the radio on all day, every day."
                />
              }
            />
          </div>
        </section>

        <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-3">
              Donations & Enquiries
            </div>
            <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-navy tracking-tight mb-2">
              Keep Klagon&apos;s voice on.
            </h2>
            <p className="text-sm text-gray leading-relaxed mb-5">
              96k, broadcast from our Klagon studio PC with MIXXX + BUTT while on air.
              Your donation covers data, power and presenters — your business
              announcement reaches every market stall with a phone. GH₵20 a month is
              a whole week of the station staying on.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <TrackLink
                href="/donate"
                source="radio"
                action="donate-click"
                metadata={{ placement: "closing-cta" }}
              >
                <Button variant="primary">♥ Donate — GH₵20 keeps us on</Button>
              </TrackLink>
              <TrackLink
                href="/donate#community-circle"
                source="radio"
                action="donate-recurring-click"
                metadata={{ placement: "closing-cta" }}
              >
                <Button variant="secondary">🔁 Join the Community Circle</Button>
              </TrackLink>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <TrackLink
                href={STUDIO_WHATSAPP}
                source="radio"
                action="whatsapp-click"
                metadata={{ placement: "closing-cta" }}
              >
                <Button variant="dark" size="sm">
                  💬 WhatsApp the studio
                </Button>
              </TrackLink>
              <TrackLink
                href={`tel:${STUDIO_PHONE}`}
                source="radio"
                action="call-click"
                metadata={{ placement: "closing-cta" }}
              >
                <Button variant="outline" size="sm">
                  📞 {STUDIO_PHONE_HUMAN}
                </Button>
              </TrackLink>
            </div>
            <p className="text-gray/70 text-[11px] mt-6">
              Station website:{" "}
              <TrackLink
                href={STATION_SITE}
                source="radio"
                action="station-site-click"
                className="underline"
              >
                klagon-radio.ismyradio.com
              </TrackLink>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
