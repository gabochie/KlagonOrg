"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title?: string;
  /**
   * What went wrong, in the visitor's terms.
   *
   * Never pass a raw Supabase or upstream error message here: those leak table
   * and column names, and they read as machine output to the person looking
   * at them. Log the detail and show a sentence that says what to do next.
   */
  message?: ReactNode;
  /** Omit for errors that retrying cannot fix, such as a permission denial. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Surfaces a "try again" button while the retry itself is still running. */
  retrying?: boolean;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Shown when a request failed. Paired with EmptyState, which is the
 * succeeded-but-nothing-to-show case.
 *
 * `role="alert"` is deliberate: a failure is worth interrupting for, unlike a
 * loading state. When `onRetry` is supplied the button carries the pending
 * state so a slow retry cannot be double-submitted.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We could not load this just now. Please try again.",
  onRetry,
  retryLabel = "Try again",
  retrying = false,
  action,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 px-3" : "py-10 px-4",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full bg-red/10 text-red mb-3",
          compact ? "w-9 h-9 text-base" : "w-12 h-12 text-xl",
        )}
      >
        !
      </div>
      <div className={cn("font-bold text-navy", compact ? "text-sm" : "text-base")}>{title}</div>
      <div className={cn("text-gray mt-1 max-w-sm", compact ? "text-xs" : "text-sm")}>{message}</div>
      {onRetry || action ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onRetry ? (
            <Button size="sm" variant="dark" disabled={retrying} onClick={onRetry}>
              {retrying ? "Retrying…" : retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}