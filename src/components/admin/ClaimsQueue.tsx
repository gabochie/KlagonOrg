"use client";

import { useCallback, useEffect, useState } from "react";
import { approveClaim, fetchClaimQueue, rejectClaim, type Claim } from "@/lib/claims";
import { Button } from "@/components/ui/Button";

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
        <div className="text-xs text-gray mt-0.5 max-sm:text-[13px]">
          Verify the requester runs the business, then approve — they can edit photos, prices,
          and reply to reviews.
        </div>
      </div>

      {notice && (
        <div className="text-xs font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2 mb-3">
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
              <div className="text-sm font-bold text-navy break-words">{c.sponsorName ?? c.sponsorId}</div>
              <div className="text-xs text-gray mt-0.5 max-sm:text-[13px]">
                {[c.relationship, c.phone, c.note].filter(Boolean).join(" · ") || "No details given"}
              </div>
              <div className="text-xs text-gray/60 mt-0.5">
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 sm:flex sm:gap-1.5">
                <Button
                  disabled={busy === c.id}
                  onClick={() => void approve(c)}
                  variant="dark"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Approve
                </Button>
                <Button
                  disabled={busy === c.id}
                  onClick={() => void reject(c)}
                  variant="dangerSoft"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
