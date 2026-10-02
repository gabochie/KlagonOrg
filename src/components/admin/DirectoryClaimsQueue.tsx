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
import { Button } from "@/components/ui/Button";

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

/**
 * Short handle the operator can quote in a bug report so a user-visible failure
 * correlates with the console line that still holds the real PostgREST error.
 * Derived from the message so it is stable for one failure instead of changing
 * on every render, which is what makes it useful.
 */
function supportRefFor(message: string): string {
  let h = 0;
  for (let i = 0; i < message.length; i += 1) {
    h = (h * 31 + message.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).slice(0, 6).toUpperCase();
}

export function DirectoryClaimsQueue() {
  const [claims, setClaims] = useState<AdminDirectoryClaim[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [decideError, setDecideError] = useState<string | null>(null);
  const [supportRef, setSupportRef] = useState("");

  const load = useCallback(async () => {
    const { claims: rows, error } = await fetchAdminDirectoryClaims();
    setClaims(rows);
    setLoadError(error);
    setSupportRef(error ? supportRefFor(error) : "");
    // The detail the UI deliberately does not render. Keep it in the console so
    // the operator still has the RPC/table/migration name when debugging.
    if (error) console.error("[directory-claims] load failed:", error);
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

  if (loading) return <div className="text-sm text-gray">Loading listing claims…</div>;

  const pending = claims.filter((c) => c.status === "pending");
  const decided = claims.filter((c) => c.status !== "pending").slice(0, DECIDED_LIMIT);

  return (
    <div className="flex flex-col gap-3" data-testid="directory-claims">
      {loadError && (
        <div
          data-testid="directory-claims-error"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[11px] font-bold text-red-800"
        >
          Could not load listing claims.
          <div className="font-normal text-red-700 mt-1">
            Nothing has been changed. Try again in a moment; if it keeps failing, quote reference{" "}
            <span className="font-bold">{supportRef}</span> when reporting this.
          </div>
          {/* The raw Supabase/PostgREST message stays out of the DOM. It names
              the RPC (admin_directory_claims), usually the table, and on a
              misconfigured project names the migration that has not been
              applied -- it used to render that filename right here. None of it
              means anything to a staff member deciding a business claim, and an
              admin screen that names the missing database object is free
              reconnaissance. It goes to the console instead; `supportRef` is the
              handle staff quote in a bug report so the operator can correlate
              it with the logged line. */}
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
              {/* break-words: business names in this table are user-supplied and
                  a long one ("Accra Metropolitan Driving School & Vehicle
                  Registration Agency Limited") pushed the meta line off a 320px
                  screen instead of wrapping. */}
              <div className="text-sm font-extrabold text-navy break-words">
                {c.businessName ?? c.businessId}
              </div>
              <div className="text-xs text-gray mt-0.5 max-sm:text-[13px]">
                {c.area ? `${c.area} · ` : ""}
                Listing {c.businessId} · asked {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-amber-strong">
              <ShieldCheck size={12} /> needs review
            </div>
          </div>

          <div className="mt-3 text-[13px] max-sm:text-sm text-navy">
            <span className="font-bold break-words">{c.claimantName ?? "Unnamed claimant"}</span>
            {c.claimantPhone && (
              <>
                {" · "}
                {(() => {
                  const digits = normalizePhone(c.claimantPhone);
                  const label = c.claimantPhone;
                  return digits ? (
                    /* min-h-11 on the link: on a phone this is the primary way to
                       verify a claim, and it was a ~20px inline underline under
                       a number the staff member has to read digits off. */
                    <a
                      href={waLink(digits, buildClaimVerificationMessage(c))}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="claim-verify-link"
                      className="text-blue underline font-bold inline-flex items-center gap-1 max-sm:min-h-11"
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

          {/* Two-up grid below sm, inline wrap above it. Approve and reject
              publish PII-bearing claim data, so the pair needs to be two
              deliberately-sized targets rather than whatever a 24px inline
              button happens to wrap into next to a long business name. */}
          <div className="grid grid-cols-2 gap-2 mt-3 sm:flex sm:flex-wrap sm:items-center">
            <Button
              onClick={() => void decide(c, true)}
              disabled={busy === c.id}
              data-testid="claim-approve"
              variant="dark"
              size="sm"
              className="w-full sm:w-auto max-sm:min-h-12"
            >
              <BadgeCheck size={12} /> {busy === c.id ? "Saving…" : "Approve & verify"}
            </Button>
            <Button
              onClick={() => void decide(c, false)}
              disabled={busy === c.id}
              data-testid="claim-reject"
              variant="dangerSoft"
              size="sm"
              className="w-full sm:w-auto max-sm:min-h-12"
            >
              <XCircle size={12} /> Reject
            </Button>
            <a
              href={`https://klagon.org/business`}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:col-auto text-xs font-bold text-blue underline max-sm:min-h-11 max-sm:flex max-sm:items-center max-sm:justify-center"
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
