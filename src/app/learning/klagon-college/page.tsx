import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Klagon College — KLAGON.org",
  description:
    "Klagon College is a 12-month, 4-program career and community pathway for youth — 12 live courses, one shared capstone, and a proven-skills taxonomy.",
  alternates: { canonical: "/learning/klagon-college" },
};

const CONTENT_DIR = join(
  process.cwd(),
  "content",
  "learning",
  "klagon-college",
  "data",
);

function loadJSON<T>(name: string): T {
  return JSON.parse(readFileSync(join(CONTENT_DIR, name), "utf8")) as T;
}

interface Taxonomy {
  durable: string[];
  tool: string[];
}
interface CourseRow {
  id: string;
  title: string;
  status?: string;
  category?: string;
  school?: string;
  lessons?: number;
  duration_weeks?: number;
  type?: string;
  skills?: string[];
}
interface ProgrammeRow {
  id: string;
  title: string;
  outcome: string;
  status: string;
  required: string[];
  electives: string[];
  capstone: string;
}
interface Catalogue {
  courses: CourseRow[];
  coming_soon: CourseRow[];
  capstones: CourseRow[];
}
interface ProgrammeCatalogue {
  programs: ProgrammeRow[];
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pilot: { label: "Pilot", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  coming_soon: { label: "Coming soon", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  shippable_phase1: { label: "Shippable · Phase 1", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  archived: { label: "Archived", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function skillTokens(tokens: string[] = []): string {
  return tokens
    .map((t) => t.replace(/-/g, " "))
    .map((t) => t.replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" · ");
}

export default function KlagonCollegePage() {
  const catalogue = loadJSON<Catalogue>("catalogue.json");
  const programmesDoc = loadJSON<ProgrammeCatalogue>("programs.json");
  const taxonomy = loadJSON<Taxonomy>("skills-taxonomy.json");

  const live = catalogue.courses;
  const comingSoon = catalogue.coming_soon;
  const capstones = catalogue.capstones;
  const programmes = programmesDoc.programmes;

  const courseById = new Map<string, CourseRow>([...live, ...capstones].map((c) => [c.id, c]));
  const programCards = programmes.map((p) => {
    const required = p.required
      .map((id) => courseById.get(id))
      .filter((c): c is CourseRow => Boolean(c));
    const electives = p.electives
      .map((id) => courseById.get(id))
      .filter((c): c is CourseRow => Boolean(c));
    return { ...p, required, electives };
  });

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon College
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              A 12-month pathway that turns potential into something employers and communities can
              verify.
            </h1>
            <p className="text-white/60 text-sm max-w-2xl mx-auto">
              4 programmes · {live.length} live courses · {comingSoon.length} coming soon · 1 shared
              capstone · a proven-skills taxonomy.
            </p>
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-navy mb-6">Programmes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {programCards.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-navy">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{p.outcome}</p>
                  <div className="mt-4 space-y-1.5 text-xs">
                    {p.required.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">▪ Require</span>
                        <span className="text-right text-navy">{c.title}</span>
                      </div>
                    ))}
                    {p.electives.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">▪ Elective</span>
                        <span className="text-right text-navy">{c.title}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                      <span className="text-slate-500">▣ Capstone</span>
                      <span className="text-right text-navy font-medium">{p.capstone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-navy mb-2">Live courses</h2>
            <p className="text-sm text-slate-500 mb-6">Owned by the college, already on the platform.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {live.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber">{c.id}</span>
                    <StatusBadge status={c.status ?? "live"} />
                  </div>
                  <h3 className="mt-2 font-semibold text-navy leading-snug">{c.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.duration_weeks ? `${c.duration_weeks} weeks` : c.category} · {c.type}
                  </p>
                  {c.skills && c.skills.length > 0 && (
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{skillTokens(c.skills)}</p>
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-navy mt-12 mb-2">Coming soon</h2>
            <p className="text-sm text-slate-500 mb-6">Honestly marked — not shipped until they ship.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoon.map((c) => (
                <div key={c.id} className="rounded-2xl border border-dashed border-amber/40 bg-amber-50/40 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber">Soon · {c.school}</span>
                    <StatusBadge status={c.status ?? "coming_soon"} />
                  </div>
                  <h3 className="mt-2 font-semibold text-navy leading-snug">{c.title}</h3>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-navy mt-12 mb-2">Capstone</h2>
            {capstones.map((cap) => (
              <div key={cap.id} className="rounded-2xl border border-navy/15 bg-navy/[0.03] p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-navy">{cap.title}</h3>
                  <StatusBadge status="live" />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{cap.id}</p>
                <p className="mt-2 text-sm text-slate-600">{cap.scope}</p>
                {cap.skills && cap.skills.length > 0 && (
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{skillTokens(cap.skills)}</p>
                )}
              </div>
            ))}

            <h2 className="text-2xl font-bold text-navy mt-12 mb-2">Skills taxonomy</h2>
            <p className="text-sm text-slate-500 mb-6">
              The graduate profile — durable capabilities first, tools in service of them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="text-sm font-semibold text-navy mb-2">
                  Durable ({taxonomy.durable.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.durable.map((t) => (
                    <span key={t} className="rounded-full bg-sky-50 text-sky-700 px-2.5 py-0.5 text-[11px] font-medium">
                      {t.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="text-sm font-semibold text-navy mb-2">
                  Tool ({taxonomy.tool.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.tool.map((t) => (
                    <span key={t} className="rounded-full bg-violet-50 text-violet-700 px-2.5 py-0.5 text-[11px] font-medium">
                      {t.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
