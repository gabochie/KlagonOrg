/**
 * Field kit — pure kernel for in-person business visits.
 *
 * A staffer walks in, follows the 10-minute script on their phone, and
 * captures the listing on the spot: photos, prices, contact, and the
 * owner's explicit YES. This kernel validates the capture and builds the
 * post payload — including the consent trail — so the app layer stays thin.
 * Submissions enter moderation like any other post; staff trust never
 * bypasses review.
 *
 * Pure TS. Deterministic. Fully unit-tested.
 */

import type { PostInput } from "@/types";

export interface FieldCapture {
  businessName: string;
  kind: "shop" | "food" | "stay" | "service" | "other";
  priceText: string;
  phone: string;
  hours: string;
  address: string;
  notes: string;
  consentGiven: boolean;
  consentDate: string;
  collectorId: string;
}

export interface FieldPayload {
  ok: boolean;
  input?: PostInput;
  reasons: string[];
}

const KIND_CATEGORY: Record<FieldCapture["kind"], string> = {
  shop: "Retail",
  food: "Food & Drink",
  stay: "Retail",
  service: "Services",
  other: "Other",
};

/** Normalize a Ghana phone to wa.me-ready digits, or null. */
export function normalizeFieldPhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.length === 9) return "233" + digits;
  return digits;
}

export function validateFieldCapture(c: FieldCapture): FieldPayload {
  const reasons: string[] = [];
  const name = c.businessName.trim();
  if (name.length < 2) reasons.push("business-name-missing");
  if (!normalizeFieldPhone(c.phone)) reasons.push("no-phone");
  if (!c.consentGiven) reasons.push("no-consent");
  if (!c.consentDate.trim()) reasons.push("consent-date-missing");
  if (!c.collectorId.trim()) reasons.push("no-collector");
  if (reasons.length > 0) return { ok: false, reasons };

  const detailBits = [
    c.priceText.trim() && `Prices: ${c.priceText.trim()}`,
    c.hours.trim() && `Hours: ${c.hours.trim()}`,
    c.notes.trim(),
  ].filter(Boolean) as string[];

  const input: PostInput = {
    type: "business",
    title: name,
    excerpt: c.address.trim() || undefined,
    body: detailBits.length > 0 ? detailBits.join("\n") : undefined,
    category: KIND_CATEGORY[c.kind],
    area: /klagon/i.test(c.address) ? "klagon" : "tema_west",
    contact_phone: c.phone.trim(),
    details: {
      source: "field-kit",
      consent_status: "OPTED_IN",
      consent_date: c.consentDate.trim(),
      collector_id: c.collectorId.trim(),
      kind: c.kind,
    },
  };
  return { ok: true, input, reasons: [] };
}

export const FIELD_STEPS: { title: string; detail: string }[] = [
  {
    title: "Say who you are (1 min)",
    detail: "KLAGON, the community platform. Free verified profile, customer reviews, spot on the map — free.",
  },
  {
    title: "Photograph (3 min)",
    detail: "Shopfront, 2–3 best products or rooms, price board if any. Ask before faces.",
  },
  {
    title: "Prices + hours (2 min)",
    detail: "Top 3 prices, opening hours, WhatsApp number for orders.",
  },
  {
    title: "The YES (1 min)",
    detail: "“May KLAGON publish this on klagon.org? Reply YES.” Log the date. No YES, no publish — take photos anyway only with permission.",
  },
  {
    title: "Submit on this page (3 min)",
    detail: "Fill the form below, attach photos, tick consent, submit. It enters review like any post.",
  },
];
