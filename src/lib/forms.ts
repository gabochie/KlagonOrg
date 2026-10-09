import { getBrowserClient } from "@/lib/supabase-browser";
import { recordLeadEvent } from "@/lib/analytics";

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
  if (!error) recordLeadEvent({ source: "contact-form", action: "submit" });
  return { error: error?.message ?? null };
}

export async function submitMentorApplication(data: MentorData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("mentor_applications").insert(data);
  if (!error) recordLeadEvent({ source: "mentor-form", action: "submit" });
  return { error: error?.message ?? null };
}

export async function submitSponsorApplication(data: SponsorData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("sponsor_applications").insert(data);
  if (!error) {
    recordLeadEvent({
      source: "sponsor-form",
      action: "submit",
      metadata: { plan: data.plan_id ?? "none" },
    });
  }
  return { error: error?.message ?? null };
}

export async function submitVolunteerSignup(data: VolunteerData): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Form is not wired to a backend yet. Supabase keys not configured." };
  const { error } = await client.from("volunteer_signups").insert(data);
  if (!error) recordLeadEvent({ source: "volunteer-form", action: "submit" });
  return { error: error?.message ?? null };
}

/** RLS-safe lead capture: writes via log_agent_lead RPC (lead_captures is admin-read-only). */
export async function logLeadCapture(input: {
  name?: string | null;
  phone?: string | null;
  email: string;
  source: string;
  intent?: string | null;
}): Promise<{ id: number | null; error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { id: null, error: "Lead capture not wired yet." };
  const { data, error } = await client.rpc("log_agent_lead", {
    p_name: input.name ?? null,
    p_phone: input.phone ?? null,
    p_email: input.email,
    p_source: input.source,
    p_intent: input.intent ?? null,
    p_profile_id: null,
  });
  if (!error) recordLeadEvent({ source: input.source, action: "lead-capture" });
  return { id: data ?? null, error: error?.message ?? null };
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
  if (!error) {
    recordLeadEvent({
      source: "donate-form",
      action: "submit",
      metadata: {
        channel: data.metadata?.channel ?? "momo",
        frequency: data.metadata?.frequency ?? "once",
      },
    });
  }
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
  if (!error) {
    recordLeadEvent({
      source: "inkind-form",
      action: "submit",
      metadata: { category: data.category },
    });
  }
  return { id: row?.id ?? null, error: error?.message ?? null };
}