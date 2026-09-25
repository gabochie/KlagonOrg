import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getSupabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the KLAGON.org volunteers — the people giving their time across Klagon, Tema and beyond.",
  alternates: { canonical: "/team" },
};

interface TeamMember {
  id: string;
  role: string;
  photo_url: string | null;
  status: string;
  joined_at: string;
  name: string;
}

async function getTeam(): Promise<TeamMember[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("team_members")
      .select("id,member_id,role,photo_url,status,joined_at")
      .eq("is_active", true)
      .order("joined_at", { ascending: true });
    if (error || !data || data.length === 0) return [];
    const ids = [...new Set(data.map((r) => r.member_id))];
    const { data: profiles } = await sb
      .from("profiles")
      .select("id,full_name")
      .in("id", ids);
    // profiles_public-style safety: only names are used, never contact details.
    const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return data.map((r) => ({
      id: r.id,
      role: r.role,
      photo_url: r.photo_url,
      status: r.status,
      joined_at: r.joined_at,
      name: names.get(r.member_id) ?? "KLAGON Volunteer",
    }));
  } catch {
    return [];
  }
}

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Our Team
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              The people behind KLAGON.org.
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto">
              Volunteers giving their time across Klagon — mentors, organisers, creators and
              coordinators. New members join a 30-day probation first.
            </p>
          </div>
        </section>
        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            {team.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="text-3xl mb-2">🙋</div>
                <div className="text-sm font-extrabold text-navy mb-1">
                  Our volunteer team is forming
                </div>
                <p className="text-xs text-gray mb-4">
                  Be among the first names on this page — applications are open now.
                </p>
                <Link
                  href="/volunteer"
                  className="inline-flex rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-blue transition-colors"
                >
                  Become a volunteer →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {team.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border border-border p-5 text-center hover:shadow-md transition-shadow"
                  >
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border border-border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-pale flex items-center justify-center text-3xl mx-auto mb-3">
                        🙋
                      </div>
                    )}
                    <div className="text-sm font-extrabold text-navy leading-tight">{m.name}</div>
                    <div className="text-[11px] text-gray mt-0.5 mb-2">{m.role}</div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === "active"
                          ? "bg-green/10 text-green-800"
                          : "bg-amber/10 text-navy"
                      }`}
                    >
                      {m.status === "active" ? "Team member" : "On probation"}
                    </span>
                    <div className="text-[10px] text-gray mt-1.5">
                      since{" "}
                      {new Date(m.joined_at).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
