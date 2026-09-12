import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("bg-white rounded-xl border border-border", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("text-sm font-bold text-navy", className)} {...props}>
      {children}
    </div>
  );
}

export function CardSub({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("text-xs text-gray mt-0.5", className)} {...props}>
      {children}
    </div>
  );
}
