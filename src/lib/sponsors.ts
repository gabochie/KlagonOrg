import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];
export type BadgeRow = Database["public"]["Tables"]["sponsor_badges"]["Row"];
export type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
export type SponsorTier = Database["public"]["Enums"]["sponsor_tier"];

export interface SponsorContact {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  social?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    x?: string;
  };
}

export interface SponsorLocation {
  area?: string | null;
  address?: string | null;
  google_maps_url?: string | null;
}

export function parseContact(c: SponsorRow["contact"]): SponsorContact {
  const contact = (c ?? {}) as SponsorContact;
  const social = (contact.social ?? {}) as Record<string, string>;
  return {
    phone: contact.phone ?? null,
    whatsapp: contact.whatsapp ?? null,
    email: contact.email ?? null,
    website: contact.website ?? null,
    social: Object.keys(social).length > 0 ? (social as SponsorContact["social"]) : undefined,
  };
}

export function parseLocation(l: SponsorRow["location"]): SponsorLocation {
  const loc = (l ?? {}) as SponsorLocation;
  return {
    area: loc.area ?? null,
    address: loc.address ?? null,
    google_maps_url: loc.google_maps_url ?? null,
  };
}

export function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

export function waLink(whatsapp: string | null, businessName: string): string {
  const n = whatsapp ? digitsOnly(whatsapp) : "";
  const text = `Hello ${businessName}, I found you via KLAGON.`;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "#";
}

export function telLink(phone: string | null): string {
  return phone ? `tel:${digitsOnly(phone)}` : "#";
}

export async function fetchPublicSponsors(): Promise<SponsorRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("sponsors")
    .select("*")
    .eq("status", "active")
    .order("tier", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function fetchPublicSponsorBySlug(slug: string): Promise<SponsorRow | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("sponsors")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function fetchSponsorBadges(sponsorId: string): Promise<BadgeRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("sponsor_badges")
    .select("sponsor_id,tier_type,awarded_at")
    .eq("sponsor_id", sponsorId)
    .order("awarded_at", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function fetchCardSlug(slug: string): Promise<SponsorRow | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("business_cards")
    .select("sponsor_id,slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const sponsor = await fetchPublicSponsorBySlug(data.slug);
  return sponsor ?? (await fetchSponsorById(data.sponsor_id));
}

export async function fetchSponsorById(id: string): Promise<SponsorRow | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function fetchPublicTemplates(): Promise<TemplateRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("templates")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data;
}