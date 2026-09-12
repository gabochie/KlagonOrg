import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  color,
  showLabel,
}: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 bg-light rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barClassName)}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && <span className="text-[10px] font-bold text-navy">{pct}%</span>}
    </div>
  );
}
