"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase-browser";
import { fetchSignoffs, writeSignoff, clearSignoffs } from "@/lib/qaSignoffs";
import {
  QUALITY_AREAS,
  QA_STORE_KEY,
  checkId,
  overallProgress,
  areaProgress,
  unitGaps,
  totalManualChecks,
  type CheckedMap,
} from "@/lib/quality";
import { cn } from "@/lib/utils";

function loadChecked(): CheckedMap {
  try {
    return JSON.parse(localStorage.getItem(QA_STORE_KEY) ?? "{}") as CheckedMap;
  } catch {
    return {};
  }
}

const RUNBOOK = [
  { cmd: "npm run typecheck", what: "Types must pass before anything else." },
  { cmd: "npm run lint", what: "0 errors (warnings stay pre-existing only)." },
  { cmd: "npx vitest run", what: "All unit kernels green." },
  { cmd: "npm run test:e2e", what: "Guards + hub flows green in a real browser." },
  { cmd: "npm run build", what: "923+ pages prerender; new routes listed." },
  { cmd: "SQL probes", what: "Role/RPC negative tests in the SQL Editor (see Roles area)." },
];

export function QualityCenter() {
  const { profile } = useAuth();
  const [checked, setChecked] = useState<CheckedMap>(() => loadChecked());
  const [open, setOpen] = useState<string | null>("auth-roles");
  const [notice, setNotice] = useState<string | null>(null);
  const [shared, setShared] = useState<boolean | null>(null);

  // Shared truth wins on load (union with this browser's offline ticks).
  useEffect(() => {
    void fetchSignoffs().then((remote) => {
      setShared(isSupabaseConfigured());
      if (!isSupabaseConfigured()) return;
      setChecked((prev) => {
        const next = { ...prev, ...remote };
        try {
          localStorage.setItem(QA_STORE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    });
  }, []);

  function toggle(areaId: string, i: number) {
    const id = checkId(areaId, i);
    const nextVal = !checked[id];
    const next = { ...checked };
    if (nextVal) next[id] = true;
    else delete next[id];
    setChecked(next);
    try {
      localStorage.setItem(QA_STORE_KEY, JSON.stringify(next));
    } catch {
      /* private mode — progress just won't persist */
    }
    if (isSupabaseConfigured()) {
      void writeSignoff(areaId, i, nextVal, profile?.id ?? null).then((err) => {
        if (err) setNotice(`Shared record write failed: ${err}`);
      });
    }
  }

  function reset() {
    setChecked({});
    try {
      localStorage.removeItem(QA_STORE_KEY);
    } catch {
      /* ignore */
    }
    if (isSupabaseConfigured()) {
      void clearSignoffs().then((err) =>
        setNotice(
          err
            ? `Shared reset failed: ${err}`
            : "Checklist reset everywhere — fresh release cycle started."
        )
      );
    } else {
      setNotice("Checklist reset on this browser — fresh release cycle started.");
    }
  }

  const overall = useMemo(() => overallProgress(checked), [checked]);
  const gaps = useMemo(() => unitGaps(), []);

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div>
          <div className="text-sm font-extrabold text-navy">
            Quality Center{" "}
            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pale text-navy align-middle">
              {shared === null ? "…" : shared ? "Shared ✓" : "This browser only"}
            </span>
          </div>
          <div className="text-[11px] text-gray mt-0.5">
            Exhaustive suite, worked per release. New features add tests + checklist items here
            in the same commit — coverage can never silently rot.
          </div>
        </div>
        <button
          onClick={reset}
          className="px-2.5 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold cursor-pointer hover:bg-pale"
        >
          Reset cycle
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[11px] font-bold text-navy mb-1">
          <span>
            Overall manual QA — {overall}% ({totalManualChecks()} checks)
          </span>
        </div>
        <div className="h-2 bg-light rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber to-coral transition-all"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      {notice && (
        <div className="mb-3 text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        {QUALITY_AREAS.map((a) => {
          const pct = areaProgress(a, checked);
          const isOpen = open === a.id;
          return (
            <div key={a.id} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : a.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-light/50"
              >
                <span className="text-xs font-extrabold text-navy flex-1">
                  {a.name}
                  <span className="ml-2 font-normal text-gray text-[10px]">{a.scope}</span>
                </span>
                {a.unit.length === 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 shrink-0">
                    no unit tests
                  </span>
                )}
                {a.e2e.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pale text-navy shrink-0">
                    {a.e2e.length} e2e planned
                  </span>
                )}
                <span className="text-[10px] font-bold text-gray shrink-0 w-9 text-right">{pct}%</span>
                <span className="text-gray text-xs shrink-0">{isOpen ? "▾" : "▸"}</span>
              </button>
              {isOpen && (
                <div className="border-t border-border px-3 py-2 bg-light/40">
                  {a.unit.length > 0 && (
                    <div className="text-[10px] text-gray mb-1.5">
                      Unit: {a.unit.join(", ")}
                    </div>
                  )}
                  {a.e2e.length > 0 && (
                    <div className="text-[10px] text-gray mb-1.5">
                      E2E (planned): {a.e2e.join(", ")}
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    {a.manual.map((m, i) => {
                      const id = checkId(a.id, i);
                      const done = Boolean(checked[id]);
                      return (
                        <label
                          key={id}
                          className="flex items-start gap-2 text-xs cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggle(a.id, i)}
                            className="mt-0.5 accent-[#0F1B5C]"
                          />
                          <span className={cn(done ? "line-through text-gray" : "text-navy")}>
                            {m}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {gaps.length > 0 && (
        <div className="rounded-xl border border-amber/30 bg-amber/[0.04] p-3 mb-3">
          <div className="text-[11px] font-extrabold text-navy mb-1">
            Unit-test backlog ({gaps.length} areas)
          </div>
          <div className="text-[11px] text-gray leading-relaxed">
            {gaps.map((g) => g.name).join(" · ")} — each needs a vitest kernel before it can be
            called covered.
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border p-3">
        <div className="text-[11px] font-extrabold text-navy mb-1.5">Release runbook</div>
        <div className="flex flex-col gap-1">
          {RUNBOOK.map((r) => (
            <div key={r.cmd} className="flex items-baseline gap-2 text-[11px]">
              <code className="font-mono font-bold text-navy bg-light rounded px-1.5 py-0.5 shrink-0">
                {r.cmd}
              </code>
              <span className="text-gray">{r.what}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
