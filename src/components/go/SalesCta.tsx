"use client";

import { recordLeadEvent } from "@/lib/analytics";

const WA_NUMBER = "233268708895";

export function waLink(message: string, source: string, campaign = "ai-sprint-pilot") {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: "whatsapp",
    utm_campaign: campaign,
  });
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`${message} [${params.toString()}]`)}`;
}

export function SalesCta({
  source,
  courseId,
  price,
  label = "Enrol now",
  secondaryHref = "/learning",
}: {
  source: string;
  courseId?: string;
  price?: number;
  label?: string;
  secondaryHref?: string;
}) {
  const waMsg =
    source === "ai-sprint-team"
      ? "Hello KLAGON.org, I run a business and I want the AI Team Sprint for my staff (5 seats). My business name is: ___"
      : "Hello KLAGON.org, I want to join the AI Productivity Sprint (GH₵150). My name is: ___";
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {courseId ? (
        <a
          href={`/learning/${courseId}`}
          onClick={() => recordLeadEvent({ source, action: "sales-enrol-click" })}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm bg-amber text-navy font-bold hover:shadow-lg hover:shadow-amber/35 hover:-translate-y-0.5 transition-all duration-150"
        >
          {label}
          {typeof price === "number" ? ` — GH₵ ${price}` : ""} →
        </a>
      ) : (
        <a
          href="/auth/register"
          onClick={() => recordLeadEvent({ source, action: "sales-enrol-click" })}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm bg-amber text-navy font-bold hover:shadow-lg hover:shadow-amber/35 hover:-translate-y-0.5 transition-all duration-150"
        >
          {label} →
        </a>
      )}
      <a
        href={waLink(waMsg, source)}
        target="_blank"
        rel="noreferrer"
        onClick={() => recordLeadEvent({ source, action: "whatsapp-click" })}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm bg-[#25D366] text-white font-bold hover:brightness-105 transition-all duration-150"
      >
        WhatsApp us first
      </a>
      <a
        href={secondaryHref}
        onClick={() => recordLeadEvent({ source, action: "sales-secondary-click" })}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm bg-white/8 text-white/85 border border-white/15 hover:bg-white/12 transition-all duration-150"
      >
        See how it works
      </a>
    </div>
  );
}
