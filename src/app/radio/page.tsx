"use client";

import { useRef, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";

const STREAM_URL =
  process.env.NEXT_PUBLIC_RADIO_STREAM_URL ??
  "https://klagon-radio-proxy.gabochie.workers.dev/stream";

const DAYPARTS = [
  { time: "06:00", title: "Good Morning Klagon", desc: "Sunrise news + community announcements (AutoDJ loop)." },
  { time: "12:00", title: "Good Afternoon Klagon", desc: "Midday talk — market prices, traffic, schools." },
  { time: "18:00", title: "Good Evening Klagon", desc: "Evening mix — independent Klagon voices (cleared tracks only)." },
  { time: "22:00", title: "Good Night Klagon", desc: "Night loop — replays + event listings overnight." },
];

export default function RadioPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState("Ready — tap Play. HTTPS proxy, no login needed.");
  const [playing, setPlaying] = useState(false);

  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (playing) {
        el.pause();
        setPlaying(false);
        setStatus("Paused.");
      } else {
        el.src = STREAM_URL;
        await el.play();
        setPlaying(true);
        setStatus("Live — streaming via secure proxy.");
      }
    } catch {
      setPlaying(false);
      setStatus("Could not start stream. Check AutoDJ is ON in Caster panel, then retry.");
    }
  }

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon · 24/7 Automatic · Zero-Cost
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              📻 Klagon Radio
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Hyper-local talk for Klagon. No app, no login — tap play. Runs on Caster.fm
              AutoDJ + HTTPS proxy so it works on phones without &ldquo;not private&rdquo;
              warnings.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <Button variant="primary" onClick={toggle}>
                {playing ? "⏸ Pause Live" : "▶ Play Live"}
              </Button>
            </div>
            <p className="text-white/50 text-xs mt-4" aria-live="polite">
              {status}
            </p>
            <audio ref={audioRef} preload="none" className="hidden" />
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
              How it stays on 24/7 for $0
            </h2>
            <p className="text-sm text-gray leading-relaxed mb-5">
              Caster.fm AutoDJ keeps playing when your PC is off. Go live anytime with
              Mixxx + BUTT (server <code>morcast.caster.fm:10560</code>, mount{" "}
              <code>/4st2F</code>) — disconnect and AutoDJ resumes. Broadcast password
              stays in BUTT only, never in code.
            </p>
            <p className="text-xs text-gray">
              Stream source: Caster.fm free 96k mount. Player uses{" "}
              <code>NEXT_PUBLIC_RADIO_STREAM_URL</code> (proxy <code>/stream</code>).
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
