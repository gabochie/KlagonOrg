"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";

export function WelcomeBanner() {
  const { profile } = useAuth();
  const firstName = profile?.full_name.trim().split(/\s+/)[0] ?? "Member";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-navy rounded-xl p-5 sm:p-6 relative overflow-hidden flex items-center justify-between flex-wrap gap-4">
      <div className="absolute -right-5 -top-5 w-40 h-40 rounded-full bg-amber/8 pointer-events-none" />
      <div className="absolute right-15 -bottom-10 w-25 h-25 rounded-full bg-green/6 pointer-events-none" />
      <div>
        <div className="text-[11px] font-semibold text-white/50 tracking-wider uppercase mb-1">
          {today}
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1.5">
          Welcome back, {firstName}! 👋
        </div>
        <div className="text-xs text-white/55 leading-relaxed max-w-xs">
          You&apos;re on a journey. Keep showing up, keep building &mdash; every step counts.
          {profile?.xp ? ` You're at ${profile.xp} XP.` : ""}
        </div>
        <div className="flex gap-2 mt-3">
          <Link href="/learning">
            <Button size="sm" variant="primary">Continue Learning →</Button>
          </Link>
          <Link href="/dashboard/member">
            <Button size="sm" variant="ghost">View My Progress</Button>
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 relative z-10">
        <div className="bg-amber/15 border border-amber/30 rounded-lg px-3.5 py-2 text-center">
          <div className="text-xl font-extrabold text-amber">{profile?.xp ?? 0}</div>
          <div className="text-[10px] text-white/50 mt-0.5">Total XP</div>
        </div>
        <div className="bg-white/7 border border-white/10 rounded-lg px-3.5 py-2">
          <div className="text-[11px] font-bold text-white">Next workshop</div>
          <div className="text-[10px] text-white/45">Check the events page</div>
        </div>
      </div>
    </div>
  );
}