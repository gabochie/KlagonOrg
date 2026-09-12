"use client";

import { useState } from "react";
import { ADMIN_MEMBERS } from "@/lib/constants";

type Filter = "All" | "Active" | "Pending";

const statusPill = (status: string) => {
  switch (status) {
    case "active": return "bg-green/10 text-green-800";
    case "pending": return "bg-amber/10 text-amber-800";
    default: return "bg-slate-100 text-slate-600";
  }
};

export function MembersTable() {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered =
    filter === "All" ? ADMIN_MEMBERS : ADMIN_MEMBERS.filter((m) => m.status === filter.toLowerCase());

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-bold text-navy">Recent Members</div>
          <div className="text-[11px] text-gray">73 total · 7 awaiting approval</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Active", "Pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer font-sans transition-colors ${
                filter === f
                  ? "bg-navy text-white"
                  : "border border-border text-gray bg-white hover:border-navy"
              }`}
            >
              {f}
            </button>
          ))}
          <button className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-navy bg-white cursor-pointer font-sans">
            View All
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-light">
              {["Member", "Age", "Interests", "Joined", "Status", "Action"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[10px] font-bold text-gray uppercase tracking-wider text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.email} className="hover:bg-light/50 transition-colors">
                <td className="px-3 py-2.5 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: m.color, color: m.textColor }}
                    >
                      {m.initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-navy">{m.name}</div>
                      <div className="text-[11px] text-gray">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 border-t border-border text-xs text-gray">{m.age}</td>
                <td className="px-3 py-2.5 border-t border-border">
                  {m.interests.map((i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pale text-blue-800 mr-1"
                    >
                      {i}
                    </span>
                  ))}
                </td>
                <td className="px-3 py-2.5 border-t border-border text-xs text-gray">{m.joined}</td>
                <td className="px-3 py-2.5 border-t border-border">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPill(m.status)}`}
                  >
                    {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                  </span>
                </td>
                <td className="px-3 py-2.5 border-t border-border">
                  {m.status === "pending" ? (
                    <button className="px-2 py-1 rounded-lg bg-amber text-navy border border-amber text-[11px] font-semibold cursor-pointer font-sans hover:bg-amber/90 transition-colors">
                      Approve
                    </button>
                  ) : (
                    <button className="px-2 py-1 rounded-lg border border-border text-[11px] font-semibold text-navy bg-white cursor-pointer font-sans hover:bg-light transition-colors">
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
