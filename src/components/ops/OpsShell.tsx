"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-light">
      <div className="h-[44px] shrink-0 flex items-center gap-3 px-4 border-b border-border bg-white shadow-sm z-10">
        <Link
          href="/dashboard/admin"
          className="text-xs font-bold text-navy hover:text-amber transition-colors"
        >
          ← Admin
        </Link>
        <span className="h-4 w-px bg-border" />
        <span className="text-xs font-semibold text-navy">📡 Command Center</span>
        <span className="ml-auto text-[10px] font-bold tracking-widest text-gray/50">
          KLAGON · OPS
        </span>
      </div>
      <div className="flex-1 min-h-0 relative">{children}</div>
    </div>
  );
}