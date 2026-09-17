/**
 * KLAGON Instant Digital Health Score — shared pure kernel.
 *
 * Single source of truth that powers BOTH:
 *   1. the free public Instant Score (`/tools/health-score`, Phase 2 §6.50), and
 *   2. the later per-sponsor Digital Business Health Check (Phase 3 §2.02).
 * Both consume THIS file so the rubric never drifts between the free lead
 * magnet and the paid health check (spec §6.52 "shared pure function ... so
 * the free instant score and the paid health check can never drift").
 *
 * Pure TS, no React, no Supabase, no lucide, no emoji. Deterministic:
 * same inputs -> same score and same ranked recommendations. Fully unit-testable.
 * All UI/app code imports from here; nothing else recomputes a health score.
 */

export type HealthAreaId =
  | "google_visibility" // Google visibility        (weight 0.15)
  | "website" // Website                     (0.12)
  | "social_presence" // Social presence            (0.10)
  | "customer_conversion" // Customer conversion         (0.10)
  | "reviews_reputation" // Reviews & reputation        (0.10)
  | "ecommerce" // E-commerce                 (0.08)
  | "whatsapp_sales" // WhatsApp sales             (0.12)
  | "ai_readiness" // AI readiness               (0.08)
  | "automation" // Automation                 (0.08)
  | "data_analytics"; // Data & analytics           (0.07)

export interface HealthAreaDef {
  id: HealthAreaId;
  label: string;
  /** Weight in [0,1]. All weights sum to 1.00. */
  weight: number;
  /** Full 100-point "what good looks like" for this area. */
  ideal: string;
  /** Weighted term (grade * weight * 100) — what this area adds to the score. */
  contributed: number;
}

/** Weights per spec §2.02 / TIER-BENEFIT MATRIX §2.02. Sum = 1.00. */
export const HEALTH_AREAS: HealthAreaDef[] = [
  {
    id: "google_visibility",
    label: "Google visibility",
    weight: 0.15,
    ideal: "A complete, claimed Google Business Profile that ranks for local 'near me' searches.",
    contributed: 0,
  },
  {
    id: "website",
    label: "Website",
    weight: 0.12,
    ideal: "A fast, mobile-first site that answers what you sell, where you are, and how to order.",
    contributed: 0,
  },
  {
    id: "social_presence",
    label: "Social presence",
    weight: 0.1,
    ideal: "Active profiles on the platforms your customers actually use.",
    contributed: 0,
  },
  {
    id: "customer_conversion",
    label: "Customer conversion",
    weight: 0.1,
    ideal: "A clear, one-tap way for customers to ask, orderate and pay.",
    contributed: 0,
  },
  {
    id: "reviews_reputation",
    label: "Reviews & reputation",
    weight: 0.1,
    ideal: "Fresh, real reviews you actively collect and reply to.",
    contributed: 0,
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    weight: 0.08,
    ideal: "A WhatsApp catalogue or storefront where customers can browse and order.",
    contributed: 0,
  },
  {
    id: "whatsapp_sales",
    label: "WhatsApp sales",
    weight: 0.12,
    ideal: "WhatsApp Business with catalogue, quick replies and auto-greeting.",
    contributed: 0,
  },
  {
    id: "ai_readiness",
    label: "AI readiness",
    weight: 0.08,
    ideal: "Using an AI assistant for at least one recurring business task.",
    contributed: 0,
  },
  {
    id: "automation",
    label: "Automation",
    weight: 0.08,
    ideal: "Repetitive follow-ups and reminders handled automatically.",
    contributed: 0,
  },
  {
    id: "data_analytics",
    label: "Data & analytics",
    weight: 0.07,
    ideal: "Track enquiries, sales and customers so decisions are grounded in numbers.",
    contributed: 0,
  },
] as HealthAreaDef[];

/** Verify weights sum to exactly 1.00 (guards against rubric drift). */
export const WEIGHTS_SUM = HEALTH_AREAS.reduce((s, a) => s + a.weight, 0);

export interface HealthInputs extends Record<HealthAreaId, number> {}

/** Grade each area 0..1 (0 = absent, 1 = ideal state). */
export interface HealthRecommendation {
  areaId: HealthAreaId;
  title: string;
  detail: string;
  effort: "5-min" | "1-hour" | "half-day" | "1-2 days";
}

export interface HealthScore {
  /** Weighted 0–100 (rounded). */
  overall: number;
  /** Per-area weighted contribution (for the breakdown bars). */
  breakdown: { areaId: HealthAreaId; label: string; contributed: number; gap: number }[];
  /** Ranked recommendations, biggest gap first, max 3. */
  recommendations: HealthRecommendation[];
}

function oneOrZero(v: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

const AREA_ID: Record<HealthAreaId, number> = {
  google_visibility: 0,
  website: 1,
  social_presence: 2,
  customer_conversion: 3,
  reviews_reputation: 4,
  ecommerce: 5,
  whatsapp_sales: 6,
  ai_readiness: 7,
  automation: 8,
  data_analytics: 9,
};

const AREA_WEIGHT: Record<HealthAreaId, number> = {
  google_visibility: 0.15,
  website: 0.12,
  social_presence: 0.1,
  customer_conversion: 0.1,
  reviews_reputation: 0.1,
  ecommerce: 0.08,
  whatsapp_sales: 0.12,
  ai_readiness: 0.08,
  automation: 0.08,
  data_analytics: 0.07,
};

const AREA_LABEL: Record<HealthAreaId, string> = {
  google_visibility: "Google visibility",
  website: "Website",
  social_presence: "Social presence",
  customer_conversion: "Customer conversion",
  reviews_reputation: "Reviews & reputation",
  ecommerce: "E-commerce",
  whatsapp_sales: "WhatsApp sales",
  ai_readiness: "AI readiness",
  automation: "Automation",
  data_analytics: "Data & analytics",
};

function recommendationText(areaId: HealthAreaId): { title: string; detail: string; effort: HealthRecommendation["effort"] } {
  switch (areaId) {
    case "google_visibility":
      return {
        title: "Claim your Google Business Profile",
        detail: "A complete, claimed profile is the fastest free way to show up for 'near me' searches in Klagoon. Add photos, hours, WhatsApp and drive directions.",
        effort: "1-hour",
      };
    case "website":
      return {
        title: "Launch a simple one-page site",
        detail: "A fast mobile site that answers what you sell, where you are inc and how to order turns searches into customers. KLAGON's Business Studio can stand one up in a day.",
        effort: "1-2 days",
      };
    case "social_presence":
      return {
        title: "Post consistently on 1-2 platforms",
        detail: "Pick the two channels your customers actually use)Skip, post 3x a week, and keep your WhatsApp + directions in every bio.",
        effort: "half-day",
      };
    case "customer_conversion":
      return {
        title: "Make buying one tap",
        detail: "Put a single clear 'Order on WhatsApp' button on your profile, posts and flyers so a customer can buy without hunting for how.",
        effort: "1-hour",
      };
    case "reviews_reputation":
      return {
        title: "Collect & reply to reviews",
        detail: "Ask happy customers for a review at the moment they pay,Skip 0 reply to every review within a day — public proof beats advertising.",
        effort: "1-hour",
      };
    case "ecommerce":
      return {
        title: "Open a WhatsApp catalogue",
        detail: "List your top products with photos + prices in WhatsApp Business so customers can browse and order even when you are closed.",
        effort: "half-day",
      };
    case "whatsapp_sales":
      return {
        title: "Set up WhatsApp Business properly",
        detail: "Auto-greeting, quick replies and a catalogue mean enquiries never go cold — the single highest-leverage sales move for a Klagoon business.",
        effort: "1-hour",
      };
    case "ai_readiness":
      return {
        title: "Use AI for one recurring task",
        detail: "Pick one repetitive weekly task (drafting replies, captions, or quotes) and let a free AI assistant handle it — KLAGON's generators make this instant.",
        effort: "1-hour",
      };
    case "automation":
      return {
        title: "Automate your follow-ups",
        detail: "Set one automatic WhatsApp follow-up for enquiries so no lead is ever dropped — the cheapest 'salesperson' you will ever hire.",
        effort: "1-hour",
      };
    case "data_analytics":
      return {
        title: "Track the three numbers that matter",
        detail: "Sales per week, cost to win a customer, and what customers ask most. KlagoonOrg's calculators make this a 5-minute habit.",
        effort: "5-min",
      };
  }
}

/** Weighted 0–100 health score + ranked top-3 recommendations. Pure & deterministic. */
export function computeHealthScore(inputs: HealthInputs): HealthScore {
  const entries = Object.keys(AREA_ID) as HealthAreaId[];
  const breakdown = entries.map((areaId) => {
    const grade = oneOrZero(inputs[areaId]);
    const contributed = +(grade * AREA_WEIGHT[areaId] * 100).toFixed(2);
    const gap = Math.round((1 - grade) * 100);
    return { areaId, label: AREA_LABEL[areaId], contributed, gap };
  });
  const overall = Math.round(
    entries.reduce((sum, a) => sum + oneOrZero(inputs[a]) * AREA_WEIGHT[a] * 100, 0)
  );
  const recommendations = breakdown
    .filter((b) => b.gap > 10) // only meaningful gaps get a recommendation
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((b) => {
      const t = recommendationText(b.areaId);
      return { areaId: b.areaId, title: t.title, detail: t.detail, effort: t.effort as HealthRecommendation["effort"] };
    });
  return { overall, breakdown, recommendations };
}
