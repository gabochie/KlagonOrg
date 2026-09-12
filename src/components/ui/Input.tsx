import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-navy">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          "px-3 py-2 rounded-lg border text-sm text-navy font-sans bg-white placeholder:text-gray/60",
          "focus:outline-2 focus:outline-amber focus:border-transparent",
          error ? "border-red" : "border-border",
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  ),
);
Input.displayName = "Input";
