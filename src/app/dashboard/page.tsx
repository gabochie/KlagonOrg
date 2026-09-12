"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardPage() {
  const { loading, user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    router.replace(isAdmin ? "/dashboard/admin" : "/dashboard/member");
  }, [loading, user, isAdmin, router]);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-30" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-navy" />
        </span>
        <div className="text-xs text-gray font-semibold">Taking you to your dashboard…</div>
      </div>
    </div>
  );
}
