"use client";

import { useState } from "react";
import Link from "next/link";
import { MEMBER_COURSES } from "@/lib/constants";
import { CheckCircle } from "lucide-react";

export function LearningProgress() {
  const [courses] = useState(MEMBER_COURSES);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-navy">Learning Progress</div>
          <div className="text-[11px] text-gray mt-0.5">2 active courses · 1 completed</div>
        </div>
          <Link href="/learning" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
            All Courses →
          </Link>
      </div>
      {courses.map((c) => {
        const pct = Math.round((c.lessonsDone / c.lessons) * 100);
        return (
          <div
            key={c.id}
            className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: c.color }}
            >
              {c.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-navy truncate">{c.title}</div>
              <div className="text-[10px] text-gray">
                Lesson {c.lessonsDone} of {c.lessons} · {pct}% done
              </div>
            </div>
            {pct === 100 ? (
              <span className="px-2 py-1 rounded-full bg-green/10 text-green-800 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                <CheckCircle size="12" /> Certified
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="text-[11px] font-bold text-navy">{pct}%</div>
                <div className="w-20 h-1 bg-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: pct > 50 ? "#10B981" : "#F59E0B" }}
                  />
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-navy text-white text-[10px] font-bold cursor-pointer whitespace-nowrap font-sans hover:bg-blue transition-colors">
                  Continue
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
