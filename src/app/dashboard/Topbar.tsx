"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Topbar() {
  const isAdmin = usePathname().includes("/admin");
  const isMember = usePathname().includes("/member");

  return (
    <header className="col-span-full bg-navy flex items-center justify-between px-5 border-b border-white/8">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg bg-amber flex items-center justify-center text-[11px] font-extrabold text-navy">
            KS
          </div>
          <span className="text-xs font-bold text-white">
            {isAdmin ? "KlagonStudios Admin" : "KlagonStudios"}
          </span>
        </Link>
        {isAdmin && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/25 tracking-wide">
            ADMIN
          </span>
        )}
        {isMember && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/35 tracking-wide">
            🥈 Rising Star
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-white/45 text-xs cursor-text">
            🔍 Search members, events&hellip;
          </div>
        )}
        <div className="relative">
          <button
            className="w-[30px] h-[30px] rounded-lg bg-white/8 flex items-center justify-center cursor-pointer"
            aria-label="Notifications"
          >
            <span className="text-sm text-white/60">🔔</span>
          </button>
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber border-1.5 border-navy" />
        </div>
        {isMember ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/8 border border-white/12 cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-amber flex items-center justify-center text-[9px] font-bold text-navy">
              AK
            </div>
            <span className="text-xs text-white/85 font-medium">Ama Kofi</span>
          </div>
        ) : (
          <>
            <div className="w-[30px] h-[30px] rounded-full bg-amber flex items-center justify-center text-[11px] font-bold text-navy cursor-pointer">
              EK
            </div>
            <span className="hidden sm:inline text-xs text-white/70 font-medium">Emmanuel K.</span>
          </>
        )}
      </div>
    </header>
  );
}
