"use client";

import { Printer } from "lucide-react";

export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors ${
        className ?? ""
      }`}
    >
      <Printer size="16" />
      Print / Save as PDF
    </button>
  );
}