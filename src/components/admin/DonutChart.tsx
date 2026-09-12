"use client";

import { useEffect, useState } from "react";
import { fetchInterestDistribution, type InterestSlice } from "@/lib/queries";

const FALLBACK: InterestSlice[] = [
  { label: "Technology", value: 37, color: "#0F1B5C" },
  { label: "Entrepreneurship", value: 22, color: "#F59E0B" },
  { label: "Leadership", value: 15, color: "#10B981" },
  { label: "Jobs & Career", value: 11, color: "#FF6B47" },
];

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart() {
  const [data, setData] = useState<InterestSlice[]>(FALLBACK);

  useEffect(() => {
    void (async () => {
      const live = await fetchInterestDistribution();
      if (live.length > 0) setData(live);
    })();
  }, []);

  const TOTAL = data.reduce((s, d) => s + d.value, 0);

  function getDashArray(value: number, offset: number) {
    const length = (value / TOTAL) * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - length;
    return { dash: `${length} ${gap}`, offset: -offset };
  }

  const slices = data.reduce<(InterestSlice & { start: number })[]>(
    (acc, d) => {
      const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].value : 0;
      acc.push({ ...d, start });
      return acc;
    },
    []
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-navy">Member Interests</div>
          <div className="text-[11px] text-gray mt-0.5">Top categories on signup</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
          <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#E2E8F0" strokeWidth="12" />
          {slices.map((d) => {
            const { dash, offset } = getDashArray(d.value, (d.start / TOTAL) * CIRCUMFERENCE);
            return (
              <circle
                key={d.label}
                cx="40"
                cy="40"
                r={RADIUS}
                fill="none"
                stroke={d.color}
                strokeWidth="12"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform="rotate(-90 40 40)"
              />
            );
          })}
          <text
            x="40"
            y="45"
            textAnchor="middle"
            fontSize="13"
            fontWeight="800"
            fill="#0F1B5C"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {TOTAL}
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {slices.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-[11px] text-gray min-w-[90px]">{d.label}</span>
              <span className="text-xs font-bold text-navy">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
