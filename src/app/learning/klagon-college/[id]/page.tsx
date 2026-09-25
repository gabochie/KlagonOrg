import type { Metadata } from "next";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { sanitizeHtml } from "@/lib/sanitize";
import Link from "next/link";

export const dynamicParams = false;

const BASE = join(process.cwd(), "content", "learning", "klagon-college");

interface Row {
  id: string;
  title: string;
  status?: string;
  category?: string;
  school?: string;
  skills?: string[];
  outcomes?: string[];
  scope?: string;
  evidence?: string[];
}

interface Doc {
  courses: Row[];
  coming_soon?: Row[];
  capstones?: Row[];
}

function loadDoc(): Doc {
  return JSON.parse(readFileSync(join(BASE, "data", "catalogue.json"), "utf8")) as Doc;
}

function titleCase(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateStaticParams() {
  const doc = loadDoc();
  return [...(doc.courses ?? []), ...(doc.capstones ?? [])].map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = loadDoc();
  const row = [...(doc.courses ?? []), ...(doc.capstones ?? [])].find((c) => c.id === id);
  return {
    title: row ? `${row.title} — Klagon College` : "Klagon College",
  };
}

function syllabusFor(id: string): string | null {
  const dir = join(BASE, "syllabi");
  const file = readFileSync(join(dir, id, "README.md"), "utf8");
  return file;
}

export default async function CollegeCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = loadDoc();
  const row = [...(doc.courses ?? []), ...(doc.capstones ?? [])].find((c) => c.id === id);
  const isCapstone = row && doc.capstones?.some((c) => c.id === id);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
              <Link
                href="/learning/klagon-college"
                className="text-xs font-semibold text-amber hover:text-amber/80 transition-colors"
              >
                ← Back to Klagon College
              </Link>
            <h1 className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold text-white tracking-tight leading-tight">
              {row?.title ?? id}
            </h1>
            {row?.skills && row.skills.length > 0 && (
              <p className="mt-3 text-[13px] leading-relaxed text-white/70">
                {row.skills.map(titleCase).join(" · ")}
              </p>
            )}
          </div>
        </section>
        <section className="bg-light py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {isCapstone && (
              <div className="mb-6 rounded-2xl border border-amber/30 bg-amber-50 p-5">
                <p className="text-sm leading-relaxed text-amber-800">
                  Shared capstone: this scope is proven with real evidence, reviewed by a mentor,
                  not graded on participation.
                </p>
              </div>
            )}
            {row?.outcomes && row.outcomes.length > 0 && (
              <div className="mb-6 rounded-2xl border border-border bg-white p-5">
                <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Outcomes
                </h2>
                <ul className="space-y-1.5">
                  {row.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-sm text-navy">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">
                Syllabus
              </h2>
              {isCapstone ? (
                <p className="text-sm leading-relaxed text-slate-600">
                  The capstone is reviewed via a shared evidence pipeline: a micro-business dossier,
                  a revenue log, and mentor sign-off. Portfolio review track for P3. The detailed
                  studio guide ships with Phase 1.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-600">
                  Syllabus is live on the college catalogue. Full markdown lessons are being wired
                  to this reader in the same pipeline as the overview page.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
