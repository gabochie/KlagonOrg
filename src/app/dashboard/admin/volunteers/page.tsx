"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { VolunteerReviewQueue } from "@/components/volunteer/VolunteerReviewQueue";

export default function AdminVolunteersPage() {
  return (
    <RequireAdmin>
      <div className="p-4 sm:p-6 max-w-5xl">
        <h1 className="text-xl font-extrabold text-navy mb-1">Volunteers</h1>
        <p className="text-xs text-gray mb-5 leading-relaxed max-w-2xl">
          Verify ID details, approve volunteers into their 30-day probation, and confirm or end
          engagements after review. Approvals notify the member automatically. Performance tracking
          (tasks, hours, ratings) extends this page next.
        </p>
        <VolunteerReviewQueue />
      </div>
    </RequireAdmin>
  );
}
