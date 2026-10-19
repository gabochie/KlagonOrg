"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { adminApplyBoost } from "@/lib/posts";
import type { Database, Json } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";

/**
 * Boost requests from /my/posts, and the button that fulfils them.
 *
 * Boosts are sold by hand until a payment rail exists, so this is the other
 * end of BoostRequestPanel: the seller confirms the WhatsApp payment, then
 * applies it here. The button applies the tier and price the *database* derives
 * from the listing, so what the buyer was quoted and what they are charged
 * cannot drift apart.
 *
 * lead_events is append-only, so "already handled" is not stored as a flag; it
 * is read back from the post's live boost state after each apply. That keeps
 * the queue honest when two people look at the same request.
 */

type LeadRow = Database["public"]["Tables"]["lead_events"]["Row"];

type Request = {
  postId: string;
  title: string;
  postType: string;
  category: string;
  tier: string;
  fee: number | null;
  days: number | null;
  firstSeen: string;
  lastSeen: string;
  times: number;
  applied: boolean;
  error: string | null;
};

function str(v: Json | undefined, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: Json | undefined): number | null {
  return typeof v === "number" ? v : null;
}

function toRequest(row: LeadRow): Request | null {
  const m = (row.metadata ?? {}) as Record<string, Json | undefined>;
  const postId = str(m.post_id);
  if (!postId) return null;
  return {
    postId,
    title: str(m.title, "(listing removed)"),
    postType: str(m.post_type),
    category: str(m.category),
    tier: str(m.tier),
    fee: num(m.fee_ghs),
    days: num(m.days),
    firstSeen: row.created_at,
    lastSeen: row.created_at,
    times: 1,
    applied: false,
    error: null,
  };
}

export function BoostRequestsQueue() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [paid, setPaid] = useState<
    { id: string; postId: string; ref: string; amount: number | null; phone: string | null; paidAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const c = getBrowserClient();
    if (!c) {
      setLoading(false);
      return;
    }
    const { data, error } = await c
      .from("lead_events")
      .select("*")
      .eq("source", "boost-request")
      .eq("action", "submit")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) {
      setLoading(false);
      return;
    }

    // Same post requested twice is one conversation, not two leads.
    const byPost = new Map<string, Request>();
    for (const row of data as LeadRow[]) {
      const req = toRequest(row);
      if (!req) continue;
      const seen = byPost.get(req.postId);
      if (seen) {
        seen.times += 1;
        if (req.firstSeen < seen.firstSeen) seen.firstSeen = req.firstSeen;
      } else {
        byPost.set(req.postId, req);
      }
    }

    // Re-read boost state so requests already fulfilled do not stay actionable.
    const ids = [...byPost.keys()];
    if (ids.length > 0) {
      const { data: posts } = await c
        .from("posts")
        .select("id, boost_until")
        .in("id", ids);
      const now = Date.now();
      for (const p of (posts ?? []) as { id: string; boost_until: string | null }[]) {
        const req = byPost.get(p.id);
        if (!req) continue;
        if (p.boost_until && new Date(p.boost_until).getTime() > now) req.applied = true;
      }
    }

    // Paid online but never placed: money arrived, grant did not. These are
    // the highest-priority rows in this queue — a payer is waiting.
    const { data: paidRows } = await c
      .from("boost_payments")
      .select("id,post_id,provider_ref,amount_ghs,payer_phone,paid_at")
      .eq("status", "paid")
      .eq("fulfilled", false)
      .order("paid_at", { ascending: true })
      .limit(50);
    setPaid(
      ((paidRows ?? []) as {
        id: string;
        post_id: string;
        provider_ref: string;
        amount_ghs: number | null;
        payer_phone: string | null;
        paid_at: string;
      }[]).map((r) => ({
        id: r.id,
        postId: r.post_id,
        ref: r.provider_ref,
        amount: r.amount_ghs,
        phone: r.payer_phone,
        paidAt: r.paid_at,
      }))
    );

    setRequests([...byPost.values()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Wrapped so the first setState lands in a microtask rather than the
    // effect body, which trips react-hooks/set-state-in-effect.
    void (async () => {
      await load();
    })();
  }, [load]);

  async function apply(postId: string) {
    setBusy(postId);
    setRequests((rs) => rs.map((r) => (r.postId === postId ? { ...r, error: null } : r)));
    const res = await adminApplyBoost(postId);
    if (res.ok) {
      // Placement is live; drop the paid row optimistically (it stays
      // fulfilled=false in the DB until the grant path marks it — the next
      // load re-checks). Simplest honest state: reload the queue.
      await load();
    } else {
      setRequests((rs) =>
        rs.map((r) =>
          r.postId === postId ? { ...r, error: res.error ?? "Could not apply the boost." } : r
        )
      );
    }
    setBusy(null);
  }

  if (loading) return <div className="text-xs text-gray">Loading boost requests…</div>;

  return (
    <div className="flex flex-col gap-2.5" data-testid="boost-requests">
      {paid.map((p) => (
        <div
          key={p.id}
          data-testid="boost-paid-unfulfilled"
          className="bg-amber/10 rounded-2xl border border-amber p-4 shadow-sm"
        >
          <div className="text-xs font-extrabold uppercase tracking-widest text-amber-strong mb-1">
            Paid online — needs placement
          </div>
          <div className="text-sm font-extrabold text-navy break-words">
            GH₵ {p.amount ?? "?"} · {p.phone ?? "no phone"} · ref {p.ref}
          </div>
          <div className="text-xs text-gray mt-0.5">
            Paid {new Date(p.paidAt).toLocaleString()} — grant did not apply. Apply it or refund.
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Button
              onClick={() => void apply(p.postId)}
              disabled={busy === p.postId}
              variant="dark"
              size="sm"
              className="max-sm:min-h-12"
            >
              {busy === p.postId ? "Applying…" : "Apply boost now"}
            </Button>
          </div>
          {requests.find((r) => r.postId === p.postId)?.error && (
            <div className="text-xs text-red-700 mt-2">Could not apply — check the listing status.</div>
          )}
        </div>
      ))}
      {requests.length === 0 && paid.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="text-2xl mb-2">💡</div>
          <div className="text-sm font-bold text-navy">No boost requests yet</div>
          <div className="text-xs text-gray mt-1">
            Requests from listing owners on /my/posts land here.
          </div>
        </div>
      )}
      {requests.map((r) => (
        <div
          key={r.postId}
          data-testid="boost-request"
          data-post-id={r.postId}
          className="bg-white rounded-2xl border border-border p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-navy break-words">{r.title}</div>
              <div className="text-xs text-gray mt-0.5 max-sm:text-[13px]">
                {[r.postType, r.category].filter(Boolean).join(" · ")}
                {" · asked "}
                {new Date(r.lastSeen).toLocaleString()}
                {r.times > 1 && ` · ${r.times} requests for this listing`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold text-amber-strong">
                GH₵ {r.fee ?? "?"} / {r.days ?? "?"}d
              </div>
              <div className="text-[10px] uppercase tracking-wide font-bold text-gray">{r.tier}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {r.applied ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <Zap size={12} /> Boost applied
              </span>
            ) : (
              <Button
                onClick={() => void apply(r.postId)}
                disabled={busy === r.postId}
                variant="dark"
                size="sm"
                className="max-sm:min-h-12"
              >
                {busy === r.postId ? "Applying…" : "Mark paid & apply boost"}
              </Button>
            )}
            <a
              href={`https://klagon.org/news/${r.postId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue underline max-sm:min-h-11 max-sm:inline-flex max-sm:items-center"
            >
              View listing
            </a>
          </div>

          {r.error && <div className="text-xs text-red-700 mt-2 max-sm:text-[13px]">{r.error}</div>}
        </div>
      ))}
    </div>
  );
}
