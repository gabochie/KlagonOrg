"use client";

import { useCallback, useEffect, useState } from "react";
import { approveClaim, fetchClaimQueue, rejectClaim, type Claim } from "@/lib/claims";

export function ClaimsQueue() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setClaims(await fetchClaimQueue());
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function approve(c: Claim) {
    setBusy(c.id);
    setNotice(null);
    const res = await approveClaim(c.id, c.sponsorId, c.claimantId);
    if (!res.ok) setNotice(res.error ?? "Approve failed.");
    else await load();
    setBusy(null);
  }

  async function reject(c: Claim) {
    setBusy(c.id);
    setNotice(null);
    const res = await rejectClaim(c.id);
    if (!res.ok) setNotice(res.error ?? "Reject failed.");
    else await load();
    setBusy(null);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="mb-3">
        <div className="text-sm font-extrabold text-navy">Ownership Claims ({claims.length})</div>
        <div className="text-[11px] text-gray mt-0.5">
          Verify the requester runs the business, then approve — they can edit photos, prices,
          and reply to reviews.
        </div>
      </div>

      {notice && (
        <div className="text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2 mb-3">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-gray font-semibold">Loading claims…</div>
      ) : claims.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray">
          No pending claims. New requests appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {claims.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-3">
              <div className="text-xs font-bold text-navy">{c.sponsorName ?? c.sponsorId}</div>
              <div className="text-[11px] text-gray mt-0.5">
                {[c.relationship, c.phone, c.note].filter(Boolean).join(" · ") || "No details given"}
              </div>
              <div className="text-[10px] text-gray/60 mt-0.5">
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  disabled={busy === c.id}
                  onClick={() => void approve(c)}
                  className="px-2.5 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={busy === c.id}
                  onClick={() => void reject(c)}
                  className="px-2.5 py-1.5 rounded-lg bg-light text-red-700 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
