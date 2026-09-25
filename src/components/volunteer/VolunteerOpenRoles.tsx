"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchMyVolunteerApplications,
  fetchOrgVolunteerRoles,
  type OrgRole,
  type VolunteerApplication,
} from "@/lib/volunteers";

const STATUS_LABEL: Record<string, string> = {
  pending: "Applied · under review",
  probationary: "On probation",
  active: "On the team 🎉",
  inactive: "Ended",
  rejected: "Not successful",
};

/** Claimable org openings, listed under the Volunteer tab. */
export function VolunteerOpenRoles() {
  const { profile } = useAuth();
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [myApps, setMyApps] = useState<VolunteerApplication[]>([]);

  useEffect(() => {
    void fetchOrgVolunteerRoles().then(setRoles);
  }, []);

  useEffect(() => {
    if (!profile?.id) {
      void Promise.resolve([]).then(setMyApps);
      return;
    }
    void fetchMyVolunteerApplications(profile.id).then(setMyApps);
  }, [profile?.id]);

  if (roles.length === 0) return null;

  const appFor = (postId: string) =>
    myApps.find((a) => a.post_id === postId) ?? null;

  return (
    <div className="mb-10">
      <h2 className="text-base font-extrabold text-navy mb-1">Open roles — claimable now</h2>
      <p className="text-xs text-gray mb-4">
        Concrete KLAGON.org openings. Claiming starts an application with ID verification —
        unpaid, 30-day probation.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => {
          const app = profile ? appFor(r.id) : null;
          const open = app && ["pending", "probationary", "active"].includes(app.status);
          return (
            <div
              key={r.id}
              className="bg-navy rounded-xl p-5 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber text-navy">
                  {r.category}
                </span>
                {r.positionType && (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {r.positionType}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mb-1 leading-snug">{r.title}</h3>
              {r.excerpt && (
                <p className="text-xs text-white/60 leading-relaxed mb-3">{r.excerpt}</p>
              )}
              {r.deadline && (
                <div className="text-[11px] text-white/50 mb-3">Closes {r.deadline}</div>
              )}
              {open && app ? (
                <div className="w-full py-2 rounded-lg text-xs font-bold text-center bg-white/10 text-amber">
                  {STATUS_LABEL[app.status] ?? app.status}
                </div>
              ) : (
                <Link
                  href={`/volunteer/apply?role=${encodeURIComponent(r.title)}&post=${r.id}`}
                  className="block text-center w-full py-2 rounded-lg text-xs font-bold bg-amber text-navy hover:bg-white transition-colors"
                >
                  Claim this role →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
