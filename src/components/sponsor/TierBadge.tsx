import type { SponsorTier } from "@/lib/sponsors";
import { SPONSOR_TIERS } from "@/lib/constants";

const STYLES: Record<string, string> = {
  community: "bg-emerald/10 text-emerald border-emerald/30",
  growth: "bg-amber/10 text-amber border-amber/40",
  talent: "bg-blue/10 text-blue border-blue/30",
  digital: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  strategic: "bg-navy/10 text-navy border-navy/30",
};

export function TierBadge({ tier }: { tier: SponsorTier }) {
  const meta = SPONSOR_TIERS.find((t) => t.id === tier);
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-bold ${
        STYLES[tier] ?? STYLES.community
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {meta?.label ?? "Partner"}
    </span>
  );
}

export function TierShortLabel({ tier }: { tier: SponsorTier }) {
  const meta = SPONSOR_TIERS.find((t) => t.id === tier);
  return meta?.short ?? "Partner";
}