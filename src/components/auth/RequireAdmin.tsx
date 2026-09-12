"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) router.replace("/dashboard");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-30" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-navy" />
          </span>
          <div className="text-xs text-gray font-semibold">Checking permissions…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}