"use client";

import { useState } from "react";
import Link from "next/link";
import { MEMBER_PROJECTS } from "@/lib/constants";
import type { Project } from "@/types";

export function CommunityProjects() {
  const [joined, setJoined] = useState<Set<string>>(new Set(["1"]));

  const toggleJoin = (id: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy">Community Projects</div>
          <Link href="/projects" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
            All Projects →
          </Link>
      </div>
      {MEMBER_PROJECTS.map((p: Project) => {
        const isJoined = joined.has(p.id);
        return (
          <div key={p.id} className="py-2.5 border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: p.color }}
              >
                {p.icon}
              </div>
              <div className="text-xs font-bold text-navy flex-1">{p.title}</div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isJoined
                    ? "bg-green/10 text-green-800"
                    : "bg-amber/10 text-amber-800"
                }`}
              >
                {isJoined ? "Joined" : `${p.spotsOpen} spots open`}
              </span>
            </div>
            <div className="mb-1.5">
              <div className="h-1 bg-light rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-gray">
                  {p.progress > 0 ? `${Math.round(p.progress)}%` : "Not started"}
                </span>
              </div>
            </div>
            {!isJoined && (
              <button
                onClick={() => toggleJoin(p.id)}
                className="px-2.5 py-1 rounded-lg bg-light text-navy border border-border text-[10px] font-semibold cursor-pointer font-sans hover:bg-border transition-colors"
              >
                + Join as Volunteer
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
