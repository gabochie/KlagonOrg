"use client";

/**
 * Owner digest sender (admin only).
 *
 * Retention loop, zero-cost: for every claimed business, build the weekly
 * WhatsApp digest (reviews, replies needed, photo nudge) and open it
 * addressed to the owner. Nothing sends blind — staff tap Send per owner.
 */

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { buildDigestLink, buildSponsorDigest } from "@/lib/digest";

interface ClaimedRow {
  id: string;
  name: string;
  photos: string[];
  ownerName: string | null;
  ownerPhone: string | null;
}

interface RowStats {
  total: number;
  avg: number | null;
  unreplied: number;
}

export function OwnerDigests() {
  const [rows, setRows] = useState<ClaimedRow[]>([]);
  const [stats, setStats] = useState<Record<string, RowStats>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setLoading(false);
      return;
    }
    const { data } = await c
      .from("sponsors")
      .select("id,name,photos,claimed_by,owner:profiles!sponsors_claimed_by_fkey(full_name,phone)")
      .not("claimed_by", "is", null)
      .eq("status", "active")
      .order("name")
      .limit(100);
    const list = ((data ?? []) as unknown as {
      id: string;
      name: string;
      photos: string[];
      owner: { full_name: string | null; phone: string | null } | null;
    }[]).map((r) => ({
      id: r.id,
      name: r.name,
      photos: r.photos ?? [],
      ownerName: r.owner?.full_name ?? null,
      ownerPhone: r.owner?.phone ?? null,
    }));
    setRows(list);
    const entries: Record<string, RowStats> = {};
    for (const r of list) {
      const { data: revs } = await c
        .from("reviews")
        .select("rating,reply")
        .eq("sponsor_id", r.id)
        .eq("status", "approved");
      const all = (revs ?? []) as { rating: number; reply: string | null }[];
      entries[r.id] = {
        total: all.length,
        avg: all.length > 0 ? Math.round((all.reduce((s, x) => s + x.rating, 0) / all.length) * 10) / 10 : null,
        unreplied: all.filter((x) => !x.reply).length,
      };
    }
    setStats(entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  function openDigest(r: ClaimedRow) {
    const s = stats[r.id] ?? { total: 0, avg: null as number | null, unreplied: 0 };
    if (!r.ownerPhone) return;
    setBusy(r.id);
    const msg = buildSponsorDigest({
      businessName: r.name,
      reviewsTotal: s.total,
      reviewsAvg: s.avg,
      unrepliedCount: s.unreplied,
      photosCount: r.photos.length,
    });
    window.open(buildDigestLink(r.ownerPhone, msg), "_blank");
    setBusy(null);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="mb-3">
        <div className="text-sm font-extrabold text-navy">Owner Digests ({rows.length})</div>
        <div className="text-[11px] text-gray mt-0.5">
          Weekly retention tap: per-owner stats as a WhatsApp message. Staff send one by one.
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray font-semibold">Loading owners…</div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray">
          No claimed businesses yet. Approve claims first, then retain them here.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {rows.map((r) => {
            const s = stats[r.id];
            return (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="text-xs font-bold text-navy truncate">{r.name}</div>
                <div className="text-[11px] text-gray truncate mt-0.5">
                  {r.ownerName ?? "Owner"} · {s ? `${s.total} reviews${s.avg != null ? ` · ${s.avg}/5` : ""} · ${s.unreplied} need reply` : "stats loading…"}
                </div>
                <button
                  disabled={busy === r.id || !r.ownerPhone}
                  onClick={() => openDigest(r)}
                  className="mt-2 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                >
                  {r.ownerPhone ? "Open Digest in WhatsApp" : "No owner phone on file"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
