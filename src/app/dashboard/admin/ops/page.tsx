"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { OpsCommandCenter } from "@/components/ops/OpsCommandCenter";

export default function AdminDashboardOpsPage() {
  return (
    <RequireAdmin>
      <div className="relative h-[calc(100dvh-6.5rem)] min-h-[520px] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <OpsCommandCenter />
      </div>
    </RequireAdmin>
  );
}