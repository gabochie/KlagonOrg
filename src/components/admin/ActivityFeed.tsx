"use client";

import { useEffect, useState } from "react";
import { ACTIVITIES } from "@/lib/constants";
import { fetchActivityFeed } from "@/lib/queries";
import { DemoTag } from "@/components/ui";
import type { Activity } from "@/types";

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(ACTIVITIES);
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const live = await fetchActivityFeed();
      if (live.length > 0) {
        setActivities(live);
        setDemo(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy">Recent Activity</div>
        {demo ? <DemoTag /> : <span className="text-[10px] text-gray">Live</span>}
      </div>
      {activities.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-2.5 py-2 border-b border-border last:border-b-0"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
            style={{ background: a.iconBg }}
          >
            {a.icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-navy leading-relaxed">{a.title}</div>
            <div className="text-[10px] text-gray mt-0.5">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}