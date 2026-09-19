"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle, Youtube, Music2, Instagram, Facebook, MessageCircle, Star, ArrowRight } from "lucide-react";

const SOCIALS = [
  { icon: Youtube, href: "https://www.youtube.com/@KlagonOrg", label: "YouTube" },
  { icon: Music2, href: "https://www.tiktok.com/@klagonorg", label: "TikTok" },
  { icon: Instagram, href: "https://instagram.com/klagonorg", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/klagonorg", label: "Facebook" },
  { icon: MessageCircle, href: "https://wa.me/233268708895", label: "WhatsApp" },
];

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,158,11,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_70%_80%,rgba(16,185,129,0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber/5 pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-amber flex items-center justify-center text-sm font-extrabold text-navy">
            KO
          </div>
          <span className="text-sm font-bold text-white">KLAGON.org</span>
        </Link>
        <div className="flex items-center gap-2">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-amber hover:text-navy transition-all cursor-pointer"
              aria-label={s.label}
            >
              <s.icon size="14" />
            </a>
          ))}
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 relative z-10 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6">
            <Star size="12" />
            Klagon, Greater Accra — Coming Soon
          </div>

          <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
            Something
            <span className="text-amber"> big</span> is
            <br />
            coming to Klagon.
          </h1>

          <p className="text-base sm:text-lg text-white/55 leading-relaxed max-w-lg mx-auto mb-10">
            KLAGON.org is building a free hub for skills, mentorship, and opportunity.
            Be the first to know when we launch.
          </p>

          {submitted ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10 max-w-md mx-auto animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green/15 mb-4">
                <CheckCircle size="28" className="text-green" />
              </div>
              <h2 className="text-xl font-extrabold text-white mb-1">You&apos;re on the list!</h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                We&apos;ll notify you at <span className="text-amber font-semibold">{email}</span> as soon as KLAGON.org launches.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-white/35">
                <span className="flex items-center gap-1.5">🏆 Launch updates</span>
                <span className="flex items-center gap-1.5">🎓 Early access</span>
                <span className="flex items-center gap-1.5">🎉 Invite to events</span>
              </div>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-4"
              >
                <div className="flex-1 w-full relative">
                  <Mail size="16" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/12 text-white text-sm placeholder:text-white/25 font-sans focus:outline-none focus:border-amber/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber text-navy font-bold text-sm cursor-pointer hover:bg-amber/90 transition-all flex-shrink-0 font-sans"
                >
                  Get Early Access
                  <Send size="14" />
                </button>
              </form>
              {error && <p className="text-red text-xs mb-4">{error}</p>}
              <p className="text-xs text-white/25">No spam. Unsubscribe anytime.</p>
            </>
          )}

          <div className="mt-14 pt-10 border-t border-white/8">
            <div className="text-xs font-semibold text-white/30 mb-5 tracking-wider uppercase">
              What we&apos;re building
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
              {[
                { icon: "🤖", title: "AI & Tech Skills" },
                { icon: "🚀", title: "Entrepreneurship" },
                { icon: "🏆", title: "Leadership" },
                { icon: "💼", title: "Career Growth" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white/5 rounded-xl border border-white/8 p-4 text-center hover:bg-white/8 transition-colors"
                >
                  <div className="text-2xl mb-1.5">{item.icon}</div>
                  <div className="text-xs font-bold text-white/70">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/8 py-5 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/25">
            © {new Date().getFullYear()} KLAGON.org. Klagon, Greater Accra, Ghana.
          </div>
          <Link
            href="/contact"
            className="text-xs text-white/35 hover:text-amber transition-colors flex items-center gap-1"
          >
            Contact us
            <ArrowRight size="12" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
