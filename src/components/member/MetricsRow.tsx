"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MEMBER_METRICS } from "@/lib/constants";
import { fetchMyMetrics } from "@/lib/queries";
import type { Metric } from "@/types";

export function MetricsRow() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<Metric[]>(MEMBER_METRICS);

  useEffect(() => {
    if (!profile?.id) return;
    void (async () => {
      const live = await fetchMyMetrics(profile, profile.id);
      if (live.length > 0) setMetrics(live);
    })();
  }, [profile?.id, profile]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-white rounded-xl border border-border p-3 sm:p-3.5 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
            style={{ background: m.accent }}
          />
          <div className="text-[10px] font-bold text-gray uppercase tracking-wider mb-1.5">
            {m.label}
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
            {m.value}
          </div>
          <div className="text-[10px] text-gray mt-1">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}