/**
 * Discover Klagon walks — product definitions + booking math.
 * Payments reuse the Moolre donation rail (tier_id `tour:<walk-id>`);
 * the concierge confirms dates over WhatsApp. No availability calendar v1.
 * Pure math below; the worker + donate-page OTP pattern handle money.
 */

export interface TourWalk {
  id: string;
  name: string;
  tagline: string;
  duration: string;
  groupSize: string;
  priceGhs: number | null;
  whatsappOnly: boolean;
}

export const TOUR_WALKS: TourWalk[] = [
  {
    id: "wetland-market-walk",
    name: "The Wetland & Market Walk",
    tagline:
      "Shalom Junction, the palace name story, Klagon Market, a resident kitchen, the 1965 underpass, factory street, and the Sakumo lagoon at golden hour — closing with the meal.",
    duration: "4 hours",
    groupSize: "4–10 guests",
    priceGhs: 750,
    whatsappOnly: false,
  },
  {
    id: "dawn-birding",
    name: "Dawn Birding",
    tagline: "First light over the lagoon with a resident guide. Binoculars provided.",
    duration: "05:30 start",
    groupSize: "4–10 guests",
    priceGhs: 350,
    whatsappOnly: false,
  },
  {
    id: "klagon-by-night",
    name: "Klagon by Night",
    tagline: "Evening food, music, and street life with guides who live it.",
    duration: "Evening",
    groupSize: "4–10 guests",
    priceGhs: 450,
    whatsappOnly: false,
  },
  {
    id: "homowo-edition",
    name: "Homowo Edition",
    tagline: "Seasonal festival edition of the walk. Dates and price announced per season.",
    duration: "Seasonal",
    groupSize: "4–10 guests",
    priceGhs: null,
    whatsappOnly: true,
  },
];

export const IMPACT_BILL: { share: string; text: string }[] = [
  { share: "45%", text: "Food hosts and mapped businesses" },
  { share: "25%", text: "Resident guides" },
  { share: "15%", text: "Klagon Community Fund" },
  { share: "15%", text: "Operations" },
];

/** Guests below 4 can't form a walk; above 10 splits into two groups. */
export function clampGuests(n: number): number {
  if (!Number.isFinite(n)) return 4;
  return Math.min(10, Math.max(4, Math.floor(n)));
}

export function tourTotal(walkId: string, guests: number): number | null {
  const walk = TOUR_WALKS.find((w) => w.id === walkId);
  if (!walk || walk.priceGhs == null) return null;
  return walk.priceGhs * clampGuests(guests);
}

export function tourTierId(walkId: string): string {
  return `tour:${walkId}`;
}
