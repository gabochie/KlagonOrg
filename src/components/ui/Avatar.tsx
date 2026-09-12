import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  textColor?: string;
}

const sizeMap = {
  sm: "w-6 h-6 text-[9px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-10 h-10 text-sm",
};

export function Avatar({ initials, className, size = "md", color, textColor }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold flex-shrink-0",
        sizeMap[size],
        className,
      )}
      style={{
        background: color ?? "linear-gradient(135deg, #0F1B5C, #1A2E8C)",
        color: textColor ?? "#fff",
      }}
    >
      {initials}
    </div>
  );
}
