"use client";

import Link from "next/link";
import { RequireSuperAdmin } from "@/components/auth/RequireSuperAdmin";
import { RoleManager } from "@/components/super/RoleManager";
import { AuditFeed } from "@/components/super/AuditFeed";
import { QualityCenter } from "@/components/super/QualityCenter";

export default function SuperDashboard() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <RequireSuperAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Super Admin</div>
          <div className="text-xs text-gray mt-0.5">
            {today} · Platform control — roles and audit. Day-to-day ops live under Admin.
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/super/command"
            className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition-opacity"
          >
            📡 Command Center
          </Link>
          <Link
            href="/dashboard/admin"
            className="px-3 py-1.5 rounded-lg bg-white text-navy border border-border text-xs font-semibold hover:bg-light transition-colors"
          >
            Admin ops →
          </Link>
          <Link
            href="/dashboard/admin/moderation"
            className="px-3 py-1.5 rounded-lg bg-amber text-navy text-xs font-bold hover:bg-amber/90 transition-colors"
          >
            Moderation →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        <RoleManager />
        <AuditFeed />
      </div>
      <div className="mt-2.5">
        <QualityCenter />
      </div>
    </RequireSuperAdmin>
  );
}
