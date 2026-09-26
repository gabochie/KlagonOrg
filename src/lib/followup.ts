// ------------------------------------------------------------------
// Follow-up templates + helpers (lead-gen Phase 3).
// WhatsApp replies are manual (founder sends from the admin inbox via
// wa.me links built here). Email auto-replies go through the moolre
// worker /api/followup/autoreply endpoint (needs deploy + webhook wiring).
// ------------------------------------------------------------------

import { waLink } from "@/lib/wa";

function digits(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 9 || d.length > 15) return null;
  return d.startsWith("0") ? `233${d.slice(1)}` : d;
}

/** wa.me reply link for a lead's phone, or null when unusable. */
export function waReplyLink(phone: string | null, text: string): string | null {
  if (!phone) return null;
  const d = digits(phone);
  return d ? waLink(d, text) : null;
}

export function firstName(full: string | null): string {
  const n = (full ?? "").trim().split(" ")[0];
  return n || "Friend";
}

/** Hours since an ISO timestamp (for SLA badges). */
export function ageHours(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isNaN(ms) ? 0 : ms / 3600000;
}

export function slaBadge(createdAt: string, slaHours: number): {
  label: string;
  overdue: boolean;
} {
  const h = ageHours(createdAt);
  if (h < 1) return { label: "just now", overdue: false };
  if (h < 24) return { label: `${Math.floor(h)}h ago`, overdue: h > slaHours };
  const d = Math.floor(h / 24);
  return { label: `${d}d ago`, overdue: h > slaHours };
}

export const FOLLOWUP_TEMPLATES = {
  donation: (name: string, amount: string, frequency: string) =>
    `Hi ${name}, this is KLAGON.org — medase for your ${frequency === "monthly" ? "monthly " : ""}pledge of GH₵${amount}! We complete it by MoMo within 24 hours. Reply here when ready, or call 026 870 8895.`,
  inkind: (name: string, title: string) =>
    `Hi ${name}, this is KLAGON.org — medase for offering "${title}"! Can you share a photo + pickup location when free? We arrange collection within 48 hours.`,
  contact: (name: string, subject: string) =>
    `Hi ${name}, thanks for writing to KLAGON.org about "${subject}". A real person replies within 24 hours — reply here if anything is urgent.`,
  mentor: (name: string) =>
    `Hi ${name}, this is KLAGON.org — your mentor application is received and under review. We confirm within 48 hours. Medase for stepping up!`,
  mentorApproved: (name: string) =>
    `Hi ${name}, great news — your KLAGON.org mentor application is approved! 🎉 Our coordinator will message your first steps shortly.`,
  mentorRejected: (name: string) =>
    `Hi ${name}, thanks for applying as a KLAGON.org mentor. This round is full, but we'd love you in the volunteer pool — reply VOLUNTEER and we'll match you.`,
  volunteerMilestone: (name: string, role: string, day: 7 | 21 | 30) =>
    day === 30
      ? `Hi ${name}, day 30 of your "${role}" probation 🎯 — your review is due. Proud of the work so far; your coordinator confirms the outcome today.`
      : `Hi ${name}, day ${day} of your "${role}" probation ${day === 7 ? "— first week done! Keep logging hours and knocking out tasks 💪" : "— final stretch. Reviews happen at day 30; finish strong 💪"}`,
  sponsor: (name: string, tier: string) =>
    `Hi ${name}, this is KLAGON.org partnerships — medase for your interest in "${tier}"! We finalize details within 2 business days. Anything urgent, call 026 870 8895.`,
} as const;
