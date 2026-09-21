"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  approvePostClaim,
  fetchPostClaimsQueue,
  rejectPostClaim,
  type PostClaim,
} from "@/lib/postClaims";

/**
 * Listing ownership claims (admin + super admin moderation).
 * Approve transfers submitted_by + verified phone to the claimant;
 * the claimable banner disappears automatically.
 */
export function PostClaimsQueue() {
  const [claims, setClaims] = useState<PostClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchPostClaimsQueue().then((rows) => {
      if (active) {
        setClaims(rows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function decide(claim: PostClaim, approve: boolean) {
    setBusy(claim.id);
    setNotice(null);
    const res = approve
      ? await approvePostClaim(claim, claim.claimantName ?? null)
      : await rejectPostClaim(claim.id);
    if (!res.ok) {
      setNotice(res.error ?? "Something went wrong.");
    } else {
      setClaims((prev) => prev.filter((c) => c.id !== claim.id));
      setNotice(
        approve
          ? `Listing handed to ${claim.claimantName ?? "claimant"} (${claim.phone}).`
          : "Claim rejected — listing stays as it was."
      );
    }
    setBusy(null);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 mt-2.5">
      <div className="text-sm font-extrabold text-navy">Listing claims ({claims.length})</div>
      <div className="text-[11px] text-gray mt-0.5 mb-3">
        Agents claiming seeded listings. Verify the number from their original advert in the
        WhatsApp thread before approving.
      </div>
      {notice && (
        <div className="mb-3 text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2">
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
        <div className="flex flex-col gap-2">
          {claims.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/news/${c.postId}`}
                    className="text-xs font-bold text-navy hover:underline truncate block"
                  >
                    {c.postTitle ?? c.postId}
                  </Link>
                  <div className="text-[11px] text-gray mt-0.5">
                    {c.claimantName ?? "Member"} · {c.phone}
                    {c.note ? ` · “${c.note}”` : ""}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  disabled={busy === c.id}
                  onClick={() => void decide(c, true)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber text-navy text-[11px] font-bold cursor-pointer hover:bg-amber/90 disabled:opacity-50"
                >
                  Approve + hand over
                </button>
                <button
                  disabled={busy === c.id}
                  onClick={() => void decide(c, false)}
                  className="px-2.5 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold cursor-pointer hover:bg-pale disabled:opacity-50"
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
