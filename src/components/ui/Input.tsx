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
        <label htmlFor={id} className="max-sm:text-sm text-xs font-semibold text-navy">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          // text-base (16px), not text-sm (14px). iOS Safari zooms the viewport
          // on focus when the computed font-size is under 16px, which throws the
          // user out of position mid-form -- on a phone, that is often enough to
          // lose what they typed. 16px is the threshold, so this is the highest
          // value change in the mobile work and it applies to all 131 inputs
          // routed through this component.
          //
          // min-h-12 rather than a fixed height: a multi-line label or a browser
          // font-size override must not clip the field.
          //
          // max-sm:text-base / sm:text-sm keeps desktop at 14px so the existing
          // forms do not visually shift -- only phones get the larger text.
          "px-3 py-2 rounded-lg border max-sm:min-h-12 max-sm:text-base sm:text-sm text-navy font-sans bg-white placeholder:text-gray/60",
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
