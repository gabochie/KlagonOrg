import { getBrowserClient } from "@/lib/supabase-browser";

export interface ContactData {
  full_name: string | null;
  phone: string | null;
  email: string;
  subject: string | null;
  message: string;
}

export interface MentorData {
  full_name: string;
  phone: string;
  email: string;
  profession: string | null;
  topics: string[];
  motivation: string | null;
}

export interface SponsorData {
  org_name: string | null;
  full_name: string;
  phone: string;
  email: string;
  plan_id: string | null;
  message: string | null;
}

export interface VolunteerData {
  project_id: string | null;
  member_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

export interface InKindOfferData {
  member_id: string | null;
  category: string;
  title: string;
  description: string | null;
  full_name: string;
  phone: string;
  email: string | null;
}

export interface DonationIntent {
  amount_ghs: number;
  tier_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  metadata?: Record<string, string>;
}

export async function submitContact(data: ContactData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("contact_messages").insert(data);
  return { error: error?.message ?? null };
}

export async function submitMentorApplication(data: MentorData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("mentor_applications").insert(data);
  return { error: error?.message ?? null };
}

export async function submitSponsorApplication(data: SponsorData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("sponsor_applications").insert(data);
  return { error: error?.message ?? null };
}

export async function submitVolunteerSignup(data: VolunteerData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("volunteer_signups").insert(data);
  return { error: error?.message ?? null };
}

export async function recordDonationIntent(data: DonationIntent): Promise<{
  id: string | null;
  error: string | null;
}> {
  const client = getBrowserClient();
  if (!client) return { id: null, error: "Donations not wired yet. Supabase keys not configured." };
  const { data: row, error } = await client
    .from("donations")
    .insert({ ...data, status: "pending", provider: "moolre" })
    .select("id")
    .single();
  return { id: row?.id ?? null, error: error?.message ?? null };
}

export async function recordInKindOffer(data: InKindOfferData): Promise<{
  id: string | null;
  error: string | null;
}> {
  const client = getBrowserClient();
  if (!client) return { id: null, error: "Offers not wired yet. Supabase keys not configured." };
  const { data: row, error } = await client
    .from("inkind_offers")
    .insert(data)
    .select("id")
    .single();
  return { id: row?.id ?? null, error: error?.message ?? null };
}