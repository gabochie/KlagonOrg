"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, MessageCircle, ShieldCheck, XCircle } from "lucide-react";
import {
  approveDirectoryClaim,
  buildClaimVerificationMessage,
  fetchAdminDirectoryClaims,
  rejectDirectoryClaim,
  reopenDirectoryClaim,
  type AdminDirectoryClaim,
} from "@/lib/directoryClaims";
import { normalizePhone } from "@/lib/outreach";
import { waLink } from "@/lib/wa";

/**
 * Staff review queue for owner claims on the 740 static /business listings.
 *
 * A claim arrives from DirectoryClaimPanel (on the listing page) or the /business
 * claim modal, and it is the door into the paid side of the product: approved
 * listings show the verified badge and are what a business would eventually pay
 * to be featured. So a claim sitting unreviewed is not a cosmetic problem — until
 * it is decided it also blocks any further claim on that listing, because
 * directory_claims_active_business_key allows only one non-rejected row per
 * business_id. That is why pending work is pinned to the top.
 *
 * The claimant's phone number is only readable through admin_directory_claims()
 * now, so this component deliberately has no direct read of the table. The
 * WhatsApp link is the verification step: staff ask for a detail only the owner
 * would know, then approve.
 */

const DECIDED_LIMIT = 10;

export function DirectoryClaimsQueue() {
  const [claims, setClaims] = useState<AdminDirectoryClaim[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [decideError, setDecideError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { claims: rows, error } = await fetchAdminDirectoryClaims();
    setClaims(rows);
    setLoadError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Wrapped so the first setState lands in a microtask rather than the effect
    // body, which trips react-hooks/set-state-in-effect.
    void (async () => {
      await load();
    })();
  }, [load]);

  async function decide(claim: AdminDirectoryClaim, approve: boolean) {
    setBusy(claim.id);
    setDecideError(null);
    // Keyed on business_id, not id: see moveClaimStatus in directoryClaims.ts.
    const next = approve ? "approved" : "rejected";
    const res = approve
      ? await approveDirectoryClaim(claim.businessId)
      : await rejectDirectoryClaim(claim.businessId);
    if (res.ok) {
      // Kept in the list with its new status rather than dropped, so it moves
      // into "Recently decided" where staff can still undo a mis-click. The
      // whole claim list is not refetched: that would re-expose every claimant
      // phone on screen again.
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: next } : c)));
    } else {
      setDecideError(res.error ?? "That decision could not be saved.");
    }
    setBusy(null);
  }

  async function reopen(claim: AdminDirectoryClaim) {
    setBusy(claim.id);
    setDecideError(null);
    const res = await reopenDirectoryClaim(claim.businessId, claim.status === "approved" ? "approved" : "rejected");
    if (res.ok) {
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: "pending" } : c)));
    } else {
      setDecideError(res.error ?? "That claim could not be reopened.");
    }
    setBusy(null);
  }

  if (loading) return <div className="text-xs text-gray">Loading listing claims…</div>;

  const pending = claims.filter((c) => c.status === "pending");
  const decided = claims.filter((c) => c.status !== "pending").slice(0, DECIDED_LIMIT);

  return (
    <div className="flex flex-col gap-3" data-testid="directory-claims">
      {loadError && (
        <div
          data-testid="directory-claims-error"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[11px] font-bold text-red-800"
        >
          Could not load listing claims: {loadError}
          <div className="font-normal text-red-700 mt-1">
            If this says the function does not exist, migration 20260930030000_directory_claims_pii.sql has not been
            applied yet.
          </div>
        </div>
      )}

      {decideError && (
        <div
          data-testid="directory-claim-decide-error"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-900"
        >
          {decideError}
        </div>
      )}

      {!loadError && pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm font-bold text-navy">No claims waiting</div>
          <div className="text-xs text-gray mt-1">
            Owners claiming a listing on /business or /directory land here.
          </div>
        </div>
      )}

      {pending.map((c) => (
        <div
          key={c.id}
          data-testid="directory-claim"
          data-claim-id={c.id}
          data-business-id={c.businessId}
          data-status={c.status}
          className="bg-white rounded-2xl border border-border p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-navy">{c.businessName ?? c.businessId}</div>
              <div className="text-[11px] text-gray mt-0.5">
                {c.area ? `${c.area} · ` : ""}
                Listing {c.businessId} · asked {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-amber-strong">
              <ShieldCheck size={12} /> needs review
            </div>
          </div>

          <div className="mt-3 text-[12px] text-navy">
            <span className="font-bold">{c.claimantName ?? "Unnamed claimant"}</span>
            {c.claimantPhone && (
              <>
                {" · "}
                {(() => {
                  const digits = normalizePhone(c.claimantPhone);
                  const label = c.claimantPhone;
                  return digits ? (
                    <a
                      href={waLink(digits, buildClaimVerificationMessage(c))}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="claim-verify-link"
                      className="text-blue underline font-bold inline-flex items-center gap-1"
                    >
                      <MessageCircle size={12} /> {label}
                    </a>
                  ) : (
                    <span className="font-bold">{label}</span>
                  );
                })()}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={() => void decide(c, true)}
              disabled={busy === c.id}
              data-testid="claim-approve"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold hover:bg-blue transition-colors cursor-pointer disabled:opacity-60"
            >
              <BadgeCheck size={12} /> {busy === c.id ? "Saving…" : "Approve & verify"}
            </button>
            <button
              onClick={() => void decide(c, false)}
              disabled={busy === c.id}
              data-testid="claim-reject"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-light text-red-700 text-[11px] font-bold cursor-pointer disabled:opacity-60"
            >
              <XCircle size={12} /> Reject
            </button>
            <a
              href={`https://klagon.org/business`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-blue underline"
            >
              Open directory
            </a>
          </div>
        </div>
      ))}

      {decided.length > 0 && (
        <details className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <summary
            data-testid="directory-claims-decided-toggle"
            className="text-[11px] font-bold text-gray cursor-pointer select-none"
          >
            Recently decided ({claims.length - pending.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-1.5">
            {decided.map((c) => (
              <li
                key={c.id}
                data-testid="directory-claim-decided"
                data-claim-id={c.id}
                data-status={c.status}
                className="text-[11px] text-gray flex items-center justify-between gap-2 flex-wrap"
              >
                <span>
                  {c.businessName ?? c.businessId} · {c.claimantName ?? "Unnamed"}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      c.status === "approved"
                        ? "font-bold text-emerald-700"
                        : "font-bold text-gray/70"
                    }
                  >
                    {c.status}
                  </span>
                  {/* A decision has to be reversible. Approving the wrong claim
                      permanently badged a real business as verified, and the
                      only way back was a manual UPDATE in the SQL editor. */}
                  <button
                    type="button"
                    onClick={() => void reopen(c)}
                    disabled={busy === c.id}
                    data-testid="claim-reopen"
                    className="font-bold text-blue underline cursor-pointer disabled:opacity-60"
                  >
                    {busy === c.id ? "Reopening…" : "Reopen"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
