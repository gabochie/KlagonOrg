import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PublicMemberProfile } from "@/components/members/PublicMemberProfile";
import { getSupabase } from "@/lib/supabase";
import { resolveStaticKeys } from "@/lib/staticParams";
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
 * in src/data/member-ids.json is the fallback, via resolveStaticKeys.
 */
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await resolveStaticKeys(
    "/people/[id]",
    async () => {
      const sb = getSupabase();
      const { data, error } = await sb.from("profiles_public").select("id").limit(1000);
      if (error) throw error;
      return (data ?? []).map((r) => r.id as string);
    },
    MEMBER_ID_SNAPSHOT as string[]
  );
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