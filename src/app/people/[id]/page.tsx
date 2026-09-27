import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PublicMemberProfile } from "@/components/members/PublicMemberProfile";
import MEMBER_ID_SNAPSHOT from "@/data/member-ids.json";

export const metadata: Metadata = {
  title: "Member Profile — KLAGON.org",
  description:
    "A Klagon community member's public profile — their learn, build and volunteer credits with the community.",
  alternates: { canonical: "/people/[id]" },
};

/**
 * Static export enumerates member pages at build time, so generateStaticParams
 * must never hand Next an empty array — an empty list fails the whole export
 * with "missing generateStaticParams()". Approved ids come from the live
 * profiles_public view (safe columns, approved members); the committed snapshot
 * in src/data/member-ids.json is the fallback (refresh it with
 * `node scripts/refresh-member-ids.cjs`), which keeps builds deterministic when
 * Supabase is unreachable.
 */
export const dynamicParams = false;

const MAX_ATTEMPTS = 3;

async function fetchApprovedMemberIds(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`${url}/rest/v1/profiles_public?select=id&limit=1000`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (res.ok) {
        const rows = (await res.json()) as { id: string }[];
        if (rows.length > 0) return rows.map((r) => r.id);
      }
    } catch {
      if (attempt === MAX_ATTEMPTS) break;
    }
  }
  return [];
}

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const live = await fetchApprovedMemberIds();
  const ids = live.length > 0 ? live : (MEMBER_ID_SNAPSHOT as string[]);
  if (ids.length === 0) {
    throw new Error(
      "No approved member ids for the /people/[id] export. Check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, then refresh src/data/member-ids.json via `node scripts/refresh-member-ids.cjs`."
    );
  }
  return ids.map((id) => ({ id }));
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="w-full overflow-hidden bg-pale/40 min-h-screen">
      <Navbar />
      <main className="w-full">
        <PublicMemberProfile memberId={id} />
      </main>
      <Footer />
    </div>
  );
}