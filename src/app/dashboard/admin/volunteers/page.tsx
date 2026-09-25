"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { VolunteerReviewQueue } from "@/components/volunteer/VolunteerReviewQueue";
import { VolunteerPerformancePanel } from "@/components/volunteer/VolunteerPerformancePanel";

export default function AdminVolunteersPage() {
  return (
    <RequireAdmin>
      <div className="p-4 sm:p-6 max-w-5xl">
        <h1 className="text-xl font-extrabold text-navy mb-1">Volunteers</h1>
        <p className="text-xs text-gray mb-5 leading-relaxed max-w-2xl">
          Verify ID details, approve volunteers into their 30-day probation, and confirm or end
          engagements after review. Approvals notify the member automatically.
        </p>
        <VolunteerReviewQueue />
        <h2 className="text-base font-extrabold text-navy mt-8 mb-1">Performance</h2>
        <p className="text-xs text-gray mb-4 leading-relaxed max-w-2xl">
          Tasks, hours, ratings and probation watch across active engagements. Task completion
          earns +10 XP, logged hours +2 XP each, 5-star reviews +25 XP with the Star Volunteer
          badge.
        </p>
        <VolunteerPerformancePanel />
      </div>
    </RequireAdmin>
  );
}
