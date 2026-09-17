import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "dark" | "outline" | "secondary" | "amber";
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
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
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
