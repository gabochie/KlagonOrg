import Link from "next/link";
import { FileText, ArrowRight, Lock } from "lucide-react";
import { fetchPublicTemplates } from "@/lib/sponsors";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";

function TemplateCard({
  title,
  category,
  description,
  starter,
  fileUrl,
}: {
  title: string;
  category: string;
  description: string | null;
  starter: boolean;
  fileUrl: string;
}) {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 bg-white rounded-2xl border border-border p-5 hover:border-amber hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="px-2 py-0.5 rounded-full bg-pale text-blue border border-blue/20 text-[10px] font-bold">
          {category}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-light text-gray border border-border text-[10px] font-bold">
          {starter ? "Free" : "Full library"}
        </span>
      </div>
      <h3 className="text-sm font-extrabold text-navy group-hover:text-blue transition-colors flex items-center gap-1.5">
        <FileText size="14" className="text-amber flex-shrink-0" />
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray leading-relaxed line-clamp-2">{description}</p>
      )}
      <span className="text-[11px] font-bold text-blue mt-auto pt-1 group-hover:underline">
        Download →
      </span>
    </a>
  );
}

export async function TemplatesContent() {
  const templates = await fetchPublicTemplates();
  const starterCount = templates.filter((t) => t.min_tier === "community").length;

  return (
    <main className="w-full">
      <section className="bg-navy py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">Business Toolkit</div>
          <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Free business templates.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Practical, ready-to-use templates for finance, sales, operations, people, marketing, and strategy.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-wrap gap-2 mb-6">
          {TEMPLATE_CATEGORIES.map((c) => {
            const count = templates.filter((t) => t.category === c).length;
            return (
              <span key={c} className="px-3 py-1.5 rounded-full bg-pale text-navy border border-border text-xs font-bold">
                {c} ({count})
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              title={t.title}
              category={t.category}
              description={t.description}
              starter={t.min_tier === "community"}
              fileUrl={t.file_url}
            />
          ))}
          {templates.length === 0 && (
            <div className="col-span-full bg-light rounded-2xl border border-border p-8 text-center text-sm text-gray">
              Templates coming soon.
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-navy to-blue rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Lock size="18" className="text-amber" />
              <h3 className="text-sm font-extrabold">Unlock the full template library</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              KLAGON sponsors at Growth level and above get access to the full 20+ template
              library, including industry-specific toolkits and premium resources.
            </p>
          </div>
          <Link
            href="/sponsor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber text-navy text-sm font-bold hover:bg-amber/90 transition-colors flex-shrink-0"
          >
            Become a partner <ArrowRight size="13" />
          </Link>
        </div>
      </section>
    </main>
  );
}