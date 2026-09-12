"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";

export function Topbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const isAdmin = pathname.includes("/admin");
  const isMemberArea = isAdmin || pathname.includes("/member");

  const firstName = profile?.full_name.trim().split(/\s+/)[0] ?? "";
  const initials = profile?.full_name
    ? profile.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] ?? "")
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="col-span-full bg-navy flex items-center justify-between px-5 border-b border-white/8">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg bg-amber flex items-center justify-center text-[11px] font-extrabold text-navy">
            KO
          </div>
          <span className="text-xs font-bold text-white">
            {isAdmin ? "KlagonOrg Admin" : "KlagonOrg"}
          </span>
        </Link>
        {isAdmin && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/25 tracking-wide">
            ADMIN
          </span>
        )}
        {isMemberArea && !isAdmin && profile && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/35 tracking-wide">
            {profile.role.replace("_", " ").toUpperCase().replace(/^./, (c) => c.toUpperCase())}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-white/45 text-xs cursor-text">
            🔍 Search members, events&hellip;
          </div>
        )}
        <ThemeToggle dark />
        <NotificationsBell />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/8 border border-white/12">
          <div className="w-6 h-6 rounded-full bg-amber flex items-center justify-center text-[9px] font-bold text-navy">
            {initials}
          </div>
          <span className="text-xs text-white/85 font-medium max-w-28 truncate">
            {firstName || "Member"}
          </span>
        </div>
        <button
          onClick={() => void signOut()}
          className="text-[11px] font-bold text-white/60 hover:text-amber transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}