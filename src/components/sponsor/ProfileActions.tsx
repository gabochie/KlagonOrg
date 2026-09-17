"use client";

import { FileDown, MessageSquareQuote } from "lucide-react";

export function ProfileActions({
  whatsapp,
  businessName,
}: {
  whatsapp: string | null;
  businessName: string;
}) {
  const text = `Hi ${businessName}, I'd like to request a quote.`;
  const wa = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`
    : "#";

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a
        href={wa}
        target={whatsapp ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
      >
        <MessageSquareQuote size="16" />
        Request a Quote
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl bg-white text-navy border border-border text-sm font-bold hover:border-amber transition-colors"
      >
        <FileDown size="16" />
        Download Company Profile
      </button>
    </div>
  );
}