"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { FollowupInbox } from "@/components/admin/FollowupInbox";

export default function AdminInboxPage() {
  return (
    <RequireAdmin>
      <div className="p-4 sm:p-6 max-w-5xl">
        <h1 className="text-xl font-extrabold text-navy mb-1">Inbox</h1>
        <p className="text-xs text-gray mb-5 leading-relaxed max-w-2xl">
          Every lead in one place — pledges, in-kind gifts, messages, mentor
          applications. Reply on WhatsApp straight from each row; overdue items
          turn red past their response SLA.
        </p>
        <FollowupInbox />
      </div>
    </RequireAdmin>
  );
}
