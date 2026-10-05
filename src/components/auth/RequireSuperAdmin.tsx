"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SessionError, SessionPending } from "@/components/auth/SessionGate";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { loading, user, isSuperAdmin, profileLoaded, initError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Same reasoning as RequireAdmin: isSuperAdmin is false until profile.role
    // arrives, so gate on profileLoaded to avoid bouncing on a transient value.
    if (loading || !profileLoaded) return;
    if (initError) return;
    if (!user) router.replace("/admin/login");
    else if (!isSuperAdmin) router.replace("/dashboard");
  }, [loading, profileLoaded, user, isSuperAdmin, router, initError]);

  if (initError) {
    return <SessionError />;
  }

  if (loading || !profileLoaded || !isSuperAdmin) {
    return <SessionPending label="Checking permissions…" />;
  }

  return <>{children}</>;
}
