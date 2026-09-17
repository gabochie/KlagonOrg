"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { ModerationQueue } from "@/components/posts/ModerationQueue";

export default function AdminModerationPage() {
  return (
    <RequireAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Moderation queue</div>
          <div className="text-xs text-gray mt-0.5">
            Review community submissions before they go live. Authors are notified automatically.
          </div>
        </div>
      </div>
      <ModerationQueue />
    </RequireAdmin>
  );
}