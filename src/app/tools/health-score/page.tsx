"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import {
  HEALTH_AREAS,
  computeHealthScore,
  type HealthAreaId,
  type HealthInputs,
} from "@/lib/healthScore";

const QUESTIONS: { id: HealthAreaId; question: string }[] = [
  { id: "google_visibility", question: "Do customers find you on Google when they search for what you sell near you?" },
  { id: "website", question: "Do you have a fast, mobile-friendly page that says what you sell, where you are, and how to order?" },
  { id: "social_presence", question: "Do you post at least weekly on the 1–2 platforms your customers actually use?" },
  { id: "customer_conversion", question: "Can a customer order or enquire in one tap, like a WhatsApp order button?" },
  { id: "reviews_reputation", question: "Do you collect reviews and reply to them within a day?" },
  { id: "ecommerce", question: "Can customers browse your products with prices and order, for example from a WhatsApp catalogue?" },
  { id: "whatsapp_sales", question: "Is your WhatsApp Business set up with a catalogue, greeting, and quick replies?" },
  { id: "ai_readiness", question: "Do you use an AI assistant for at least one recurring business task?" },
  { id: "automation", question: "Are follow-ups and reminders handled automatically?" },
  { id: "data_analytics", question: "Do you track weekly sales, cost to win a customer, and top customer questions?" },
];

const GRADE_LABEL = ["No", "Partially", "Yes"] as const;

const WA_NUMBER = "233268708895";

function waLink(text: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function HealthScorePage() {
  const [grades, setGrades] = useState<Partial<Record<HealthAreaId, number>>>({});
  const [showResults, setShowResults] = useState(false);

  const answered = Object.keys(grades).length;
  const complete = answered === QUESTIONS.length;

  const result = useMemo(() => {
    if (!complete) return null;
    const inputs = Object.fromEntries(
      QUESTIONS.map((q) => [q.id, grades[q.id] ?? 0])
    ) as HealthInputs;
    return computeHealthScore(inputs);
  }, [grades, complete]);

  function setGrade(id: HealthAreaId, g: number) {
    setGrades((prev) => ({ ...prev, [id]: g }));
    setShowResults(false);
  }

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Free Self-Check
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Your Digital Health Score
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              10 quick questions. One 0–100 score. The 3 fixes that matter most for your shop —
              free, no account needed.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-bold text-navy mb-1">
              {answered} of {QUESTIONS.length} answered
            </div>
            <div className="h-2 rounded-full bg-pale mb-8 overflow-hidden">
              <div
                className="h-full bg-amber rounded-full transition-all"
                style={{ width: `${(answered / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {QUESTIONS.map((q, i) => (
                <div key={q.id} className="bg-white border border-border rounded-xl p-4">
                  <div className="text-sm font-bold text-navy mb-3">
                    <span className="text-gray font-semibold mr-2">{i + 1}.</span>
                    {q.question}
                  </div>
                  <div className="flex gap-2">
                    {[0, 0.5, 1].map((g, gi) => (
                      <button
                        key={g}
                        onClick={() => setGrade(q.id, g)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-colors ${
                          grades[q.id] === g
                            ? "bg-navy text-white border-navy"
                            : "bg-white text-gray border-border hover:border-navy"
                        }`}
                      >
                        {GRADE_LABEL[gi]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => complete && setShowResults(true)}
            >
              {complete ? "See My Score →" : `Answer ${QUESTIONS.length - answered} More to See Your Score`}
            </Button>

            {showResults && result && (
              <div className="mt-10">
                <div className="bg-navy rounded-2xl p-6 sm:p-8 text-center mb-6">
                  <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">
                    Your Digital Health Score
                  </div>
                  <div className="text-6xl font-extrabold text-white mb-2">{result.overall}</div>
                  <div className="text-sm text-white/70">out of 100</div>
                </div>

                <h2 className="text-lg font-extrabold text-navy mb-3">Where you stand</h2>
                <div className="flex flex-col gap-2 mb-8">
                  {[...result.breakdown]
                    .sort((a, b) => b.gap - a.gap)
                    .map((b) => (
                      <div key={b.areaId} className="bg-white border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-navy mb-1.5">
                          <span>{b.label}</span>
                          <span className="text-gray">{b.contributed.toFixed(0)} pts</span>
                        </div>
                        <div className="h-2 rounded-full bg-pale overflow-hidden">
                          <div
                            className="h-full bg-amber rounded-full"
                            style={{ width: `${100 - b.gap}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                {result.recommendations.length > 0 && (
                  <>
                    <h2 className="text-lg font-extrabold text-navy mb-3">Your top 3 fixes</h2>
                    <div className="flex flex-col gap-3 mb-8">
                      {result.recommendations.map((r, i) => (
                        <div key={r.areaId} className="bg-pale border border-border rounded-xl p-4">
                          <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-1">
                            Fix #{i + 1} · {r.effort}
                          </div>
                          <div className="text-sm font-bold text-navy mb-1">{r.title}</div>
                          <p className="text-xs text-gray leading-relaxed">{r.detail}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="bg-white border border-border rounded-2xl p-6">
                  <h2 className="text-lg font-extrabold text-navy mb-2">Want it done for you?</h2>
                  <p className="text-sm text-gray leading-relaxed mb-4">
                    This self-check points at the gaps. Our guided Health Check goes deeper and hands
                    you a done-with-you fix plan — Klagon shops pay founding rates.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={waLink("Hello KLAGON, I just scored my shop. I want the guided Digital Health Check (Klagon GH₵150 / Tema GH₵250).")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="primary" className="w-full">
                        Get Guided Health Check →
                      </Button>
                    </a>
                    <a
                      href={waLink("Hello KLAGON, I want the Google + WhatsApp Setup Sprint (Klagon GH₵300 / Tema GH₵450).")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="dark" className="w-full">
                        Book Setup Sprint →
                      </Button>
                    </a>
                  </div>
                  <p className="text-[11px] text-gray mt-3 text-center">
                    Klagon founding: Health Check GH₵150 · Sprint GH₵300 · Tema West/Metro: GH₵250 / GH₵450
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="pb-10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Link href="/sponsor" className="text-xs font-bold text-navy underline">
              Grow further with a KLAGON partnership →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
