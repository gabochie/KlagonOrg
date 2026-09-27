"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";

const PROGRAMS = [
  {
    time: "06:00 GMT",
    title: "Good Morning Klagon",
    desc: "Sunrise news, community announcements, school and trotro updates. The show every household wakes to.",
    cta: "Sponsor the sunrise",
  },
  {
    time: "12:00 GMT",
    title: "Good Afternoon Klagon",
    desc: "Market prices, traffic, clinic hours, lost-and-found. Traders and mothers keep it on.",
    cta: "Sponsor midday",
  },
  {
    time: "15:00 GMT",
    title: "Klagon Sports Hour",
    desc: "Local teams, high-school fixtures, weekend scores. The loudest hour in Klagon.",
    cta: "Sponsor sports",
  },
  {
    time: "18:00 GMT",
    title: "Good Evening Klagon",
    desc: "Community mix — independent Klagon voices, interviews, event listings. Prime time.",
    cta: "Sponsor prime time",
  },
  {
    time: "22:00 GMT",
    title: "Good Night Klagon",
    desc: "Night replays + tomorrow's notices. Falls asleep with the community.",
    cta: "Sponsor nights",
  },
];

export default function RadioPage() {
  useEffect(() => {
    const src = "https://cdn.cloud.caster.fm/widgets/embed.js";
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon · Live daily 06:00–22:00 GMT · Free
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              📻 Klagon Radio
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Hyper-local talk for Klagon — news, markets, schools, sports. No app,
              no login, press play. Requests on WhatsApp{" "}
              <a href="https://wa.me/233268708895" className="underline text-amber">
                +233 26 870 8895
              </a>
              .
            </p>
            <div className="max-w-md mx-auto bg-white rounded-2xl p-4">
              <div
                className="cstrEmbed"
                data-type="newStreamPlayer"
                data-publicToken="87d9ebef-bd0e-48eb-956d-bff39da248ab"
                data-theme="light"
                data-color="0F1B5C"
                data-channelId=""
                data-rendered="false"
              >
                <a href="https://www.caster.fm">Shoutcast Hosting</a>{" "}
                <a href="https://www.caster.fm">Stream Hosting</a>{" "}
                <a href="https://www.caster.fm">Radio Server Hosting</a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <Link href="/donate">
                <Button variant="primary">♥ Keep Klagon On Air — Donate</Button>
              </Link>
              <a href="tel:+233243262019">
                <Button variant="dark">📞 Enquiries: +233 24 326 2019</Button>
              </a>
            </div>
            <p className="text-white/50 text-xs mt-4">
              Silent? We&apos;re off-air — back 06:00 GMT. Full station at{" "}
              <a href="https://klagon-radio.ismyradio.com" className="underline text-amber">
                klagon-radio.ismyradio.com
              </a>
            </p>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy mb-1">Sponsor a show — your name on air</h2>
            <p className="text-xs text-gray mb-5">
              Five daily shows, five sponsorship slots. GH₵20/mo keeps a learner online —
              show sponsors keep the whole station on. Call to claim a show.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROGRAMS.map((d) => (
                <div key={d.time} className="border border-border rounded-2xl p-6">
                  <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-1">
                    {d.time}
                  </div>
                  <div className="text-sm font-extrabold text-navy mb-1">{d.title}</div>
                  <p className="text-xs text-gray leading-relaxed mb-3">{d.desc}</p>
                  <a href="tel:+233243262019" className="text-xs font-bold text-navy underline">
                    {d.cta} → +233 24 326 2019
                  </a>
                </div>
              ))}
            </div>
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
              Free Cloud 96k, live from our Klagon studio PC while on air. Your donation
              covers data, power and presenters — your business announcement reaches
              every market stall with a phone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/donate">
                <Button variant="primary">♥ Donate — GH₵20 keeps us on</Button>
              </Link>
              <a href="https://wa.me/233268708895">
                <Button variant="dark">💬 WhatsApp the studio</Button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
