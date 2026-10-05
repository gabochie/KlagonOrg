"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SessionError, SessionPending } from "@/components/auth/SessionGate";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, initError } = useAuth();
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
    // A failed handshake is not a signed-out session. Redirecting here would
    // send a signed-in member to the login page because their connection
    // dropped, so hold on the error and let them retry instead.
    if (initError) return;
    if (!user) {
      router.replace(loginHref);
    }
  }, [loading, user, router, loginHref, initError]);

  if (loading) {
    return <SessionPending />;
  }

  if (initError) {
    return <SessionError />;
  }

  // No session and no error: the redirect above is in flight.
  if (!user) {
    return <SessionPending />;
  }

  return <>{children}</>;
}