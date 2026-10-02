import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Decorative glyph or illustration. Hidden from assistive tech. */
  icon?: ReactNode;
  title: string;
  /** Explains *why* it is empty and, where useful, what to do about it. */
  description?: ReactNode;
  /** Primary call to action, usually the thing that fills this space. */
  action?: ReactNode;
  className?: string;
  /** Renders tighter, for an empty state inside a card or panel. */
  compact?: boolean;
}

/**
 * Shown when a request succeeded but there is legitimately nothing to show.
 *
 * This is deliberately distinct from an error: an empty queue is a healthy
 * state, so it gets a calm tone and no retry button. Conflating the two is what
 * makes apps show "Something went wrong" to a shop owner whose queue is simply
 * clear, which trains people to ignore the message.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 px-3" : "py-12 px-4",
        className,
      )}
    >
      {icon ? (
        <div aria-hidden="true" className={cn("mb-3", compact ? "text-2xl" : "text-4xl")}>
          {icon}
        </div>
      ) : null}
      <div className={cn("font-bold text-navy", compact ? "text-sm" : "text-base")}>{title}</div>
      {description ? (
        <div className={cn("text-gray mt-1 max-w-sm", compact ? "text-xs" : "text-sm")}>
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}