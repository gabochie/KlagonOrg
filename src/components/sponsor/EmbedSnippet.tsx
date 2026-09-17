"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function EmbedSnippet({ html }: { html: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="relative">
      <pre className="text-[11px] leading-relaxed bg-navy text-emerald rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">
        {html}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-[11px] font-bold hover:bg-white/20 transition-colors"
      >
        {copied ? <Check size="12" /> : <Copy size="12" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}