import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "ghost"
  | "dark"
  | "outline"
  | "secondary"
  | "amber"
  | "danger"
  | "dangerSoft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-amber text-navy font-bold hover:shadow-lg hover:shadow-amber/35 hover:-translate-y-0.5",
  ghost: "bg-white/8 text-white/85 border border-white/15 hover:bg-white/12",
  dark: "bg-navy text-white font-bold hover:bg-blue",
  outline: "bg-transparent text-navy font-bold border-2 border-navy hover:bg-navy/5 dark:text-white dark:border-white/30 dark:hover:bg-white/10 dark:hover:border-white/50",
  secondary: "bg-white text-navy border border-border font-semibold hover:bg-light",
  amber: "bg-amber text-navy font-bold hover:bg-amber/90",
  // Destructive action, two weights. `danger` is the filled red the moderation
  // and claims queues already hand-wrote inline; `dangerSoft` is the light
  // surface with red text used for a reject that sits next to an equally
  // weighted approve.
  //
  // These exist so reject/cancel stop being hand-written <button> markup. Every
  // one of them was a ~24px target because there was no variant to reach for,
  // and a named variant is what stops that regressing.
  danger: "bg-red-700 text-white font-bold hover:bg-red-800",
  dangerSoft: "bg-light text-red-700 border border-red-200 font-semibold hover:bg-red-50",
};

// min-h, not h: a multi-line label must not clip, and a browser font-size
// override must not either.
//
// max-sm: keeps the lift phone-only. The 44px floor exists because a fingertip
// needs roughly 44px to hit reliably and because it clears the ~40px thumb zone
// on a large handset -- neither applies to a mouse on a desktop, where raising
// sm from 28px to 44px would visibly wreck every form and toolbar. Every size
// below already renders at or above 44px on desktop except sm (28px), so sm is
// the one that gains a floor everywhere and the two larger sizes only move on
// small screens.
const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs min-h-11",
  md: "px-4 py-2.5 text-sm max-sm:min-h-12",
  lg: "px-6 py-3 text-sm max-sm:min-h-13",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg transition-all duration-150 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
