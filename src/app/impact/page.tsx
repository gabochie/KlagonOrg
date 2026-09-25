import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getSupabase } from "@/lib/supabase";
import { COMMUNITY_SHOTS } from "@/lib/community";

export const metadata: Metadata = {
  title: "Our Impact",
  description:
    "What KLAGON.org has built with the Klagon community so far — live numbers from the platform, updated every day.",
  alternates: { canonical: "/impact" },
};

interface ImpactNumbers {
  courses: number;
  lessons: number;
  team: number;
  openRoles: number;
}

async function getImpact(): Promise<ImpactNumbers> {
  const fallback = { courses: 0, lessons: 0, team: 0, openRoles: 0 };
  try {
    const sb = getSupabase();
    const now = new Date().toISOString();
    const [coursesRes, teamRes, rolesRes] = await Promise.all([
      sb.from("courses_public").select("lesson_count"),
      sb.from("team_members").select("id", { count: "exact", head: true }).eq("is_active", true),
      sb
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("type", "job")
        .eq("status", "approved")
        .lte("published_at", now)
        .eq("details->>org_role", "true")
        .or(`expires_at.is.null,expires_at.gt.${now}`),
    ]);
    const lessons = (coursesRes.data ?? []).reduce(
      (sum, r) => sum + (typeof r.lesson_count === "number" ? r.lesson_count : 0),
      0,
    );
    return {
      courses: coursesRes.data?.length ?? 0,
      lessons,
      team: teamRes.count ?? 0,
      openRoles: rolesRes.count ?? 0,
    };
  } catch {
    return fallback;
  }
}

const photos = COMMUNITY_SHOTS.filter((s) =>
  ["/brand/community/banner-2.jpg", "/brand/community/chief.jpg", "/brand/community/lady.jpg"].includes(
    s.src,
  ),
);

export default async function ImpactPage() {
  const impact = await getImpact();
  const stats = [
    { value: String(impact.courses), label: "Free courses live" },
    { value: String(impact.lessons), label: "Lessons published" },
    { value: String(impact.team), label: "Volunteers on the team" },
    { value: String(impact.openRoles), label: "Open volunteer roles" },
  ];

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Our Impact
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Proof, not promises.
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto">
              Live numbers pulled straight from the platform today — courses taught, volunteers
              serving, roles waiting to be claimed.
            </p>
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl border border-border p-5 text-center"
                >
                  <div className="text-2xl sm:text-3xl font-extrabold text-navy">{s.value}</div>
                  <div className="text-[11px] text-gray mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {photos.map((p) => (
                <figure key={p.src} className="rounded-xl overflow-hidden border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} className="w-full h-44 object-cover" loading="lazy" />
                  <figcaption className="px-3 py-2 text-[11px] text-gray">
                    {p.caption} <span className="text-gray/60">· {p.credit}</span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
                <div className="text-xl mb-2">📚</div>
                <h2 className="text-sm font-extrabold text-navy mb-1">Learning that compounds</h2>
                <p className="text-xs text-gray leading-relaxed">
                  Free short courses with interactive quizzes, XP and badges — from digital
                  foundations to publishing real websites. Every lesson ends in something built,
                  not just something read.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
                <div className="text-xl mb-2">🙋</div>
                <h2 className="text-sm font-extrabold text-navy mb-1">Volunteers who stay</h2>
                <p className="text-xs text-gray leading-relaxed">
                  ID-verified applications, a 30-day probation, tracked tasks and hours, and
                  performance reviews. The team page names every person serving — probation
                  badges included, honestly.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-navy p-6 sm:p-8 text-center">
              <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">
                Fund the next number on this page.
              </h2>
              <p className="text-xs text-white/60 max-w-md mx-auto mb-5">
                Monthly gifts keep learners online, volunteers moving, and new courses coming.
                Corporate packages sponsor whole tracks and roles.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/donate"
                  className="inline-flex rounded-lg bg-amber px-5 py-2.5 text-xs font-bold text-navy hover:bg-white transition-colors"
                >
                  Donate →
                </Link>
                <Link
                  href="/sponsor"
                  className="inline-flex rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/15 transition-colors"
                >
                  Sponsor a track
                </Link>
                <Link
                  href="/volunteer"
                  className="inline-flex rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/15 transition-colors"
                >
                  Volunteer
                </Link>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-gray">
              Donor names appear only with explicit consent — ask us and we&apos;ll add you.{" "}
              <Link href="/contact" className="font-bold text-blue hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
