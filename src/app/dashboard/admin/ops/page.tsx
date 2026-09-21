"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * The Command Center moved to /dashboard/super/command (Super Admin only).
 * Super admins auto-forward; everyone else gets a plain explanation
 * instead of a confusing permission bounce.
 */
export default function AdminDashboardOpsPage() {
  const { loading, user, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/admin/login");
    else if (isSuperAdmin) router.replace("/dashboard/super/command");
  }, [loading, user, isSuperAdmin, router]);

  if (loading || isSuperAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-gray font-semibold">Taking you to the Command Center…</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-8 max-w-md mx-auto mt-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-pale flex items-center justify-center mx-auto mb-4 text-xl">
        📡
      </div>
      <h1 className="text-sm font-extrabold text-navy mb-1">Command Center moved</h1>
      <p className="text-xs text-gray leading-relaxed mb-4">
        The Command Center is now a Super Admin tool. Your admin workspace is unchanged —
        moderation, outreach and events are where they were.
      </p>
      <Link
        href="/dashboard/admin"
        className="inline-block px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition-opacity"
      >
        Back to Admin →
      </Link>
    </div>
  );
}
