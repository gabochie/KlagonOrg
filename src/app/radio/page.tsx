"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const DAYPARTS = [
  { time: "06:00", title: "Good Morning Klagon", desc: "Sunrise news + community announcements." },
  { time: "12:00", title: "Good Afternoon Klagon", desc: "Midday talk — market prices, traffic, schools." },
  { time: "18:00", title: "Good Evening Klagon", desc: "Evening mix — independent Klagon voices (cleared tracks only)." },
  { time: "22:00", title: "Good Night Klagon", desc: "Night loop — replays + event listings." },
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
              Klagon · Live · Free Community Radio
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              📻 Klagon Radio
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Hyper-local talk for Klagon. No app, no login — press play below.
              Live when our Broadcaster PC is on (Free plan, 96k).
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
                <a href="https://www.caster.fm">Shoutcast Hosting</a>
              </div>
            </div>
            <p className="text-white/50 text-xs mt-4">
              If silent, we&apos;re off-air — PC reconnects shortly. Full station at{" "}
              <a href="https://klagon-radio.ismyradio.com" className="underline text-amber">
                klagon-radio.ismyradio.com
              </a>
            </p>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy mb-1">Today on Klagon Radio</h2>
            <p className="text-xs text-gray mb-5">
              The Klagon Daily Trilogy in rotation — morning, afternoon, evening, night.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DAYPARTS.map((d) => (
                <div key={d.time} className="border border-border rounded-2xl p-6">
                  <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-1">
                    {d.time}
                  </div>
                  <div className="text-sm font-extrabold text-navy mb-1">{d.title}</div>
                  <p className="text-xs text-gray leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-navy tracking-tight mb-2">
              How it runs $0
            </h2>
            <p className="text-sm text-gray leading-relaxed mb-5">
              Caster.fm Cloud Free (Icecast, 96k) + official Broadcaster on Windows.
              Free = live while PC is on (no AutoDJ, sleeps after 15 min idle).
              24/7 PC-off needs Pro AutoDJ.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
