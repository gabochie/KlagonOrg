"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { EventsModerationQueue } from "@/components/events/EventsModerationQueue";

export default function AdminEventsPage() {
  return (
    <RequireAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Event approvals</div>
          <div className="text-xs text-gray mt-0.5">
            Review member-proposed events before they go live. Proposers are notified automatically.
          </div>
        </div>
      </div>
      <EventsModerationQueue />
    </RequireAdmin>
  );
}