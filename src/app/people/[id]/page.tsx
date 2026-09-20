import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PublicMemberProfile } from "@/components/members/PublicMemberProfile";

export const metadata: Metadata = {
  title: "Member Profile — KLAGON.org",
  description:
    "A Klagon community member's public profile — their learn, build and volunteer credits with the community.",
  alternates: { canonical: "/people/[id]" },
};

/**
 * Fails open: if Supabase is unreachable at build time we ship zero member
 * pages rather than breaking the export. Approved member ids only come from
 * the profiles_public view (safe columns, approved members).
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/profiles_public?select=id&limit=1000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { id: string }[];
    return rows.map((r) => ({ id: r.id }));
  } catch {
    return [];
  }
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