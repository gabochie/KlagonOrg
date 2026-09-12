import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "pending" | "inactive" | "workshop" | "hackathon" | "leadership" | "service" | "amber";

interface BadgeProps {
  variant: BadgeVariant;
  children: string;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  active: "bg-green/10 text-green-800",
  pending: "bg-amber/10 text-amber-800",
  inactive: "bg-slate-100 text-slate-600",
  workshop: "bg-amber/10 text-amber-800",
  hackathon: "bg-green/10 text-green-800",
  leadership: "bg-pale text-blue-800",
  service: "bg-coral/10 text-orange-800",
  amber: "bg-amber/15 text-amber border border-amber/25",
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
