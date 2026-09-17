"use client";

import { useEffect, useState, useMemo } from "react";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";
import { SPONSOR_TIERS } from "@/lib/constants";

type Application = Database["public"]["Tables"]["sponsor_applications"]["Row"];
type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];
type SponsorTier = Database["public"]["Enums"]["sponsor_tier"];

function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function SponsorAdminContent() {
  const [tab, setTab] = useState<"applications" | "sponsors">("applications");
  const [apps, setApps] = useState<Application[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<Application | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tier, setTier] = useState<SponsorTier>("community");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const c = getBrowserClient();
    if (!c) return;
    setLoading(true);
    const [{ data: a }, { data: s }] = await Promise.all([
      c.from("sponsor_applications").select("*").order("created_at", { ascending: false }),
      c.from("sponsors").select("*").order("created_at", { ascending: false }),
    ]);
    setApps(a ?? []);
    setSponsors(s ?? []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const startPromote = (app: Application) => {
    setPromoting(app);
    const fallback = app.org_name || app.full_name || "business";
    setName(fallback);
    setSlug(slugify(fallback));
    setTier((app.plan_id as SponsorTier) ?? "community");
    setMsg(null);
  };

  const doPromote = async () => {
    if (!promoting || !slug.trim() || !name.trim()) return;
    const c = getBrowserClient();
    if (!c) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await c.rpc("promote_sponsor_application", {
      p_application_id: promoting.id,
      p_slug: slug.trim(),
      p_tier: tier,
      p_name: name.trim(),
    });
    setBusy(false);
    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }
    setMsg(`Sponsor created (id ${data}). Page will refresh.`);
    setPromoting(null);
    await load();
  };

  const updateStatus = async (id: string, status: Sponsor["status"]) => {
    const c = getBrowserClient();
    if (!c) return;
    await c.from("sponsors").update({ status }).eq("id", id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Sponsors</div>
          <div className="text-xs text-gray mt-0.5">
            Manage sponsorship applications and active partner profiles.
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["applications", "sponsors"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors border ${
              tab === t
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-border hover:border-navy"
            }`}
          >
            {t === "applications"
              ? `Applications (${apps.filter((a) => a.status === "pending").length})`
              : `Active Sponsors (${sponsors.filter((s) => s.status === "active").length})`}
          </button>
        ))}
      </div>

      {msg && (
        <div className="px-4 py-2 mb-3 rounded-lg bg-emerald/10 text-emerald text-xs font-bold border border-emerald/30">
          {msg}
        </div>
      )}

      {loading && <div className="text-xs text-gray py-8 text-center">Loading…</div>}

      {!loading && tab === "applications" && (
        <div className="flex flex-col gap-2">
          {apps.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-6 text-center text-sm text-gray">
              No applications yet.
            </div>
          )}
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-navy">{app.full_name}</div>
                {app.org_name && <div className="text-xs text-gray">{app.org_name}</div>}
                <div className="text-[11px] text-gray mt-0.5">
                  {app.email} · {app.phone} · plan: {app.plan_id ?? "—"}
                </div>
                <div className="text-[10px] text-gray mt-0.5">
                  {new Date(app.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    app.status === "pending"
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : app.status === "approved"
                      ? "bg-emerald/10 text-emerald border border-emerald/30"
                      : "bg-red/10 text-red border border-red/30"
                  }`}
                >
                  {app.status}
                </span>
                {app.status === "pending" && (
                  <button
                    onClick={() => startPromote(app)}
                    className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "sponsors" && (
        <div className="flex flex-col gap-2">
          {sponsors.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-6 text-center text-sm text-gray">
              No sponsors yet. Approve an application to create one.
            </div>
          )}
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-sm font-bold text-navy">{s.name}</div>
                  <span className="px-2 py-0.5 rounded-full bg-pale text-blue border border-blue/20 text-[10px] font-bold">
                    {SPONSOR_TIERS.find((t) => t.id === s.tier)?.short ?? s.tier}
                  </span>
                </div>
                <div className="text-[11px] text-gray">
                  /business/{s.slug} · status: {s.status}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.status === "active" ? (
                  <button
                    onClick={() => updateStatus(s.id, "paused")}
                    className="px-3 py-1.5 rounded-lg bg-white text-navy border border-border text-xs font-bold cursor-pointer font-sans hover:bg-light transition-colors"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus(s.id, "active")}
                    className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {promoting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="bg-white rounded-2xl border border-border p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="text-sm font-extrabold text-navy mb-4">
              Approve sponsor application
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-navy block mb-1">Business name</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-navy font-sans"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-navy block mb-1">Slug</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-navy font-sans"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-navy block mb-1">Tier</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm text-navy font-sans bg-white"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as SponsorTier)}
                >
                  {SPONSOR_TIERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {msg && (
              <div className="px-3 py-2 mb-3 rounded-lg bg-red/10 text-red text-xs font-bold border border-red/30">
                {msg}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPromoting(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-navy border border-border hover:bg-light transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                onClick={doPromote}
                disabled={busy || !slug.trim() || !name.trim()}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors disabled:opacity-50"
              >
                {busy ? "Creating…" : "Approve & Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}