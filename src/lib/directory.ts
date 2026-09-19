// Types + helpers for the business directory snapshot.
// Data is generated offline by scripts/build-directory.cjs into
// src/data/business-directory.json (see scripts/build-directory.cjs).

export interface DirectoryBusiness {
  id: string;
  name: string;
  category: string;
  title: string;
  area: string;
  phone: string | null;
  tel: string | null;
  wa: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  price: string | null;
  hours: string | null;
  maps: string | null;
  lat: number | null;
  lng: number | null;
  verified: boolean;
  phoneVerified: boolean;
  hasConsent: boolean;
}

export interface DirectoryCategory {
  name: string;
  count: number;
}

export interface DirectoryStats {
  total: number;
  withPhone: number;
  withWhatsApp: number;
  withRating: number;
  verified: number;
  phoneVerified: number;
  categories: number;
}

export interface DirectorySnapshot {
  builtAt: string;
  note: string;
  stats: DirectoryStats;
  categories: DirectoryCategory[];
  businesses: DirectoryBusiness[];
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function waHref(wa: string | null, businessName: string): string {
  return wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${businessName}, I found you via KLAGON.org.`)}`
    : "#";
}

export function telHref(tel: string | null): string {
  return tel ? `tel:${tel}` : "#";
}