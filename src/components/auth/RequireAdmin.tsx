"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SessionError, SessionPending } from "@/components/auth/SessionGate";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin, profileLoaded, initError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for the profile, not just the session: isAdmin is false until
    // profile.role arrives, and redirecting on that transient value bounced
    // admins out of admin pages on every hard refresh.
    if (loading || !profileLoaded) return;
    // An unreachable sign-in service is not a missing admin.
    if (initError) return;
    if (!user) router.replace("/admin/login");
    else if (!isAdmin) router.replace("/dashboard");
  }, [loading, profileLoaded, user, isAdmin, router, initError]);

  if (initError) {
    return <SessionError />;
  }

  if (loading || !profileLoaded || !isAdmin) {
    return <SessionPending label="Checking permissions…" />;
  }

  return <>{children}</>;
}