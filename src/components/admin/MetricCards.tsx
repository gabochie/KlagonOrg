"use client";

import { useEffect, useState } from "react";
import { ADMIN_METRICS } from "@/lib/constants";
import { fetchAdminMetrics } from "@/lib/queries";
import type { Metric } from "@/types";

export function MetricCards() {
  const [metrics, setMetrics] = useState<Metric[]>(ADMIN_METRICS);

  useEffect(() => {
    void (async () => {
      const live = await fetchAdminMetrics();
      if (live.cards.length > 0) setMetrics(live.cards);
    })();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-white rounded-xl border border-border p-3.5 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
            style={{ background: m.accent }}
          />
          <div className="text-[11px] font-semibold text-gray uppercase tracking-wide mb-1.5">
            {m.label}
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-2">
            {m.value}
          </div>
          {m.delta && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green/10 text-green-800 mb-1">
              ↑ {m.delta.value}
            </span>
          )}
          <div className="text-[11px] text-gray mt-0.5">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}