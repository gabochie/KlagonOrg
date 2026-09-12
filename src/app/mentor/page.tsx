"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MENTOR_TOPICS } from "@/lib/constants";
import { Button, Input } from "@/components/ui";

export default function MentorPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Become a Mentor
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Share what you know. Lift someone up.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Whether you&apos;re a professional, entrepreneur, or skilled graduate — your experience
            can change a young person&apos;s trajectory in Klagon.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-extrabold text-navy tracking-tight mb-2">
              Pick your mentoring area
            </h2>
            <p className="text-sm text-gray max-w-md mx-auto">
              Select the topics you&apos;re most passionate about sharing with Klagon&apos;s youth.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {MENTOR_TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`text-left bg-white rounded-xl border p-5 cursor-pointer font-sans transition-all hover:shadow-md ${
                  selected === t.id ? "border-amber ring-2 ring-amber/20" : "border-border"
                }`}
              >
                <div className="text-2xl mb-2">{t.icon}</div>
                <h3 className="text-sm font-bold text-navy mb-1">{t.title}</h3>
                <p className="text-xs text-gray leading-relaxed mb-2">{t.description}</p>
                <span className="text-[11px] font-semibold text-amber">{t.mentors} mentors available</span>
              </button>
            ))}
          </div>
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-extrabold text-navy text-center mb-6">
              Apply to become a mentor
            </h2>
            {submitted ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="text-3xl mb-3">🎉</div>
                <h3 className="text-base font-bold text-navy mb-1">Application received!</h3>
                <p className="text-sm text-gray">We&apos;ll review your application and get back to you within 48 hours.</p>
              </div>
            ) : (
              <form
                className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full name" placeholder="Your name" required />
                  <Input label="Phone" placeholder="0244 000 000" required />
                </div>
                <Input label="Email" type="email" placeholder="you@email.com" required />
                <Input label="Profession / Field" placeholder="e.g. Software Engineer" required />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-navy">Why do you want to mentor?</label>
                  <textarea
                    className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent resize-none h-24"
                    placeholder="Share your motivation and what you hope to give back..."
                    required
                  />
                </div>
                <Button variant="dark" size="lg" className="w-full">
                  Submit Application
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
