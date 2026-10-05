"use client";

import { RotateCw, WifiOff } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * The two non-content states a session guard can be in.
 *
 * Both guards that sit behind auth and both admin guards used to inline their
 * own copy of the spinner, and each one had its own idea of what a failed
 * session meant. Shared here so "still checking" and "could not check" look and
 * behave the same everywhere.
 */

/** Shown while the session handshake is still in flight. */
export function SessionPending({
  label = "Checking your session…",
}: {
  label?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-30" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-navy" />
        </span>
        <div className="text-xs text-gray font-semibold">{label}</div>
      </div>
    </div>
  );
}

/**
 * Shown when every handshake attempt failed.
 *
 * The point of this state: a connection that dropped is not a logout. Without
 * it the guards read the empty session as "signed out" and redirect, which sends
 * a perfectly signed-in member to the login page over one lost packet.
 * Renders nothing when there is no error, so callers can mount it unconditionally.
 */
export function SessionError() {
  const { initError, retryAuth } = useAuth();
  if (!initError) return null;

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber/20 text-amber-strong">
          <WifiOff size={20} aria-hidden="true" />
        </span>
        <div>
          <div className="text-sm font-bold text-navy dark:text-white">
            Can&apos;t check your sign-in
          </div>
          <p className="mt-1 text-xs text-gray dark:text-white/70">{initError}</p>
        </div>
        <button
          type="button"
          onClick={retryAuth}
          className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <RotateCw size={14} aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}