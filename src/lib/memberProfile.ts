import type { Database } from "@/lib/database.types";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { mapPost } from "@/lib/posts";
import type { Post } from "@/types";

export type PublicMember = Database["public"]["Views"]["profiles_public"]["Row"];

/** Fetch a member's public profile (approved members only, safe columns). */
export async function fetchPublicMember(
  memberId: string
): Promise<{ member: PublicMember | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { member: null, error: null };
  const c = getBrowserClient();
  if (!c) return { member: null, error: null };
  const { data, error } = await c
    .from("profiles_public")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();
  if (error) return { member: null, error: error.message };
  return { member: data as PublicMember | null, error: null };
}

/** A member's approved, public open content (news, jobs, events, classifieds). */
export async function fetchMemberPosts(memberId: string): Promise<Post[]> {
  if (!isSupabaseConfigured()) return [];
  const c = getBrowserClient();
  if (!c) return [];
  const { data, error } = await c
    .from("posts")
    .select("*")
    .eq("status", "approved")
    .eq("submitted_by", memberId)
    .lt("reports", 3)
    .order("published_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((row) => mapPost(row as Parameters<typeof mapPost>[0]));
}