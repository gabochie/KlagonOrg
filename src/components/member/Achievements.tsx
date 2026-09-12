"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { MEMBER_BADGES } from "@/lib/constants";
import { fetchMyBadges } from "@/lib/queries";
import type { Badge } from "@/types";

export function Achievements() {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>(MEMBER_BADGES);

  useEffect(() => {
    if (!profile?.id) return;
    void (async () => {
      const live = await fetchMyBadges(profile.id);
      if (live.length > 0) setBadges(live);
    })();
  }, [profile?.id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy">Achievements</div>
          <Link href="/learning" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
            See All →
          </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border bg-white min-w-[60px] ${
              b.unlocked ? "border-border" : "border-border opacity-35 grayscale"
            }`}
          >
            <span className="text-xl">{b.icon}</span>
            <span className="text-[9px] font-bold text-navy text-center">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}