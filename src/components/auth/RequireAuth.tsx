"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Staff routes bounce to the staff login; everything else to member login.
  const loginHref =
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/dashboard/super") ||
    pathname.startsWith("/admin/")
      ? "/admin/login"
      : "/auth/login";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginHref);
      return;
    }
  }, [loading, user, router, loginHref]);

  if (loading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-30" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-navy" />
          </span>
          <div className="text-xs text-gray font-semibold">Checking your session…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}