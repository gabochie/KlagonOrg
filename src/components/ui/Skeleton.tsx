import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Renders a circle, for standing in for avatars and source badges. */
  circle?: boolean;
}

/**
 * Placeholder block for content that has not arrived yet.
 *
 * The pulse is disabled under `prefers-reduced-motion`. An endlessly shimmering
 * block is exactly the repeating animation that provokes vestibular symptoms,
 * so a reduced-motion visitor gets a flat grey block that still communicates
 * "something belongs here and it is not ready" without any movement.
 *
 * Always `aria-hidden`. The surrounding region owns the accessible loading
 * message (see LoadingBlock), so assistive tech should never announce these.
 */
export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-pale animate-pulse motion-reduce:animate-none",
        circle ? "rounded-full" : "rounded-md",
        className,
      )}
      {...props}
    />
  );
}

interface SkeletonTextProps {
  /** Number of placeholder lines. */
  lines?: number;
  className?: string;
}

/**
 * A short paragraph of stacked placeholder lines.
 *
 * The final line is deliberately narrower: a ragged edge reads as "text is
 * still arriving", where equal-width blocks read as a table or a progress bar
 * and give the visitor the wrong idea about what is loading.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

interface LoadingBlockProps {
  /** Announced to screen readers, and shown visually unless `hideLabel`. */
  label?: string;
  /** Hides the label visually while keeping it available to assistive tech. */
  hideLabel?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Accessible wrapper for one or more skeletons.
 *
 * The skeletons themselves are `aria-hidden`, so this is the only thing a
 * screen reader announces while content loads. It is marked `role="status"` so
 * the announcement is polite and does not interrupt whatever the visitor was
 * already reading.
 */
export function LoadingBlock({
  label = "Loading",
  hideLabel = true,
  className,
  children,
}: LoadingBlockProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className={hideLabel ? "sr-only" : "text-xs text-gray"}>{label}</span>
      {children}
    </div>
  );
}

interface LoadingMessageProps {
  label: string;
  className?: string;
}

/**
 * A plain centred "Loading X..." status line, for places where the shape of the
 * arriving content is not knowable well enough to draw a skeleton.
 *
 * These replaced `<div className="animate-pulse ...">Loading queue...</div>`,
 * which was the pattern in eleven places across the admin, posts, events and
 * jobs surfaces. Pulsing the text itself was the wrong call: a label whose
 * opacity breathes is both harder to read and a stronger vestibular trigger
 * than a static block, and it told the visitor nothing about what was coming.
 * The text is now static and carries `role="status"`, so it is announced once
 * instead of flickering in and out of existence.
 */
export function LoadingMessage({ label, className }: LoadingMessageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center py-16 text-center text-sm font-semibold text-gray",
        className,
      )}
    >
      {label}
    </div>
  );
}