"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { JOURNEY_STAGES } from "@/lib/constants";
import { fetchMyLessonProgress, fetchMyVolunteerProjectIds } from "@/lib/queries";
import type { JourneyStage } from "@/types";

export function JourneyTracker() {
  const { profile } = useAuth();
  const [stages, setStages] = useState<JourneyStage[]>(JOURNEY_STAGES);
  const [subtitle, setSubtitle] = useState("You're at Stage 2 — keep learning to unlock Build");

  useEffect(() => {
    if (!profile?.id) return;
    void (async () => {
      const [lessons, projects] = await Promise.all([
        fetchMyLessonProgress(profile.id),
        fetchMyVolunteerProjectIds(profile.id),
      ]);
      const xp = profile.xp ?? 0;

      let current = 1;
      if (lessons.length > 0) current = 2;
      if (projects.length > 0) current = 3;
      if (xp >= 300) current = 4;
      if (xp >= 600) current = 5;

      setStages(
        JOURNEY_STAGES.map((s, i) => ({
          ...s,
          state: (i < current ? "done" : i === current ? "current" : "locked") as JourneyStage["state"],
        }))
      );
      const currentStage = JOURNEY_STAGES[current] ?? JOURNEY_STAGES[0];
      setSubtitle(`You're at Stage ${current + 1} — ${currentStage.name}. Keep going to unlock what's next.`);
    })();
  }, [profile?.id, profile?.xp]);

  return (
    <div className="bg-white rounded-xl border border-border p-4 sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-navy">Your KlagonStudios Journey</div>
          <div className="text-[11px] text-gray mt-0.5">
            {subtitle}
          </div>
        </div>
        <Link href="/learning" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
          View Full Roadmap →
        </Link>
      </div>
      <div className="flex items-center gap-0">
        {stages.map((stage, i) => (
          <Fragment key={stage.id}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-base relative mb-1.5 ${
                  stage.state === "done"
                    ? "bg-navy"
                    : stage.state === "current"
                      ? "bg-amber shadow-[0_0_0_4px_rgba(245,158,11,0.2)]"
                      : "bg-light border-2 border-dashed border-border"
                }`}
              >
                <span style={{ fontSize: 18, opacity: stage.state === "locked" ? 0.4 : 1 }}>
                  {stage.icon}
                </span>
                {stage.state === "done" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green flex items-center justify-center text-[9px] text-white border-2 border-white">
                    ✓
                  </div>
                )}
              </div>
              <div className="text-[10px] font-bold text-navy text-center">{stage.name}</div>
              <div className="text-[9px] text-gray text-center mt-0.5">
                {stage.state === "done" && <span className="text-green">Complete</span>}
                {stage.state === "current" && <span className="text-amber">In Progress</span>}
                {stage.state === "locked" && "Locked"}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full -mt-5 ${
                  stage.state === "done"
                    ? "bg-navy"
                    : stage.state === "current"
                      ? "bg-gradient-to-r from-navy to-amber"
                      : "bg-border"
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
