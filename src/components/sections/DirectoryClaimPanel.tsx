"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, BadgeCheck, ShieldCheck, Users } from "lucide-react";
import type { DirectoryBusiness } from "@/lib/directory";
import {
  ORG_WA,
  type DirectoryClaimState,
  buildClaimMessage,
  buildInviteMessage,
  buildInviteFallbackMessage,
  buildGroupJoinMessage,
  waLink,
  fetchDirectoryClaimMap,
  fileDirectoryClaim,
} from "@/lib/directoryClaims";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors cursor-pointer font-sans";

export function DirectoryClaimPanel({ business: b }: { business: DirectoryBusiness }) {
  const [state, setState] = useState<DirectoryClaimState>("unclaimed");
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDirectoryClaimMap([b.id]).then((map) => {
      if (!cancelled) setState(map[b.id] ?? "unclaimed");
    });
    return () => {
      cancelled = true;
    };
  }, [b.id]);

  const inviteHref = b.wa
    ? waLink(b.wa, buildInviteMessage({ name: b.name }))
    : waLink(ORG_WA, buildInviteFallbackMessage({ name: b.name, area: b.area }));

  /**
   * Claiming over WhatsApp alone left this page unable to record anything, so a
   * claim made from a listing profile — the page people actually land on from
   * search — never reached the staff queue and this panel stayed "unclaimed"
   * forever. The WhatsApp handoff is still how ownership gets verified; the
   * insert is only so the claim is visible to staff and lockable.
   */
  function claim() {
    if (!name.trim() || !phone.trim()) {
      setProblem("Please add your name and WhatsApp number.");
      return;
    }
    setBusy(true);
    setProblem(null);
    const text = buildClaimMessage({
      name: b.name,
      id: b.id,
      area: b.area,
      claimantName: name.trim(),
      claimantPhone: phone.trim(),
    });
    // Opened from the click handler so popup blockers allow it, as on /business.
    window.open(waLink(ORG_WA, text), "_blank");
    void fileDirectoryClaim({
      businessId: b.id,
      businessName: b.name,
      area: b.area,
      claimantName: name.trim(),
      claimantPhone: phone.trim(),
    }).then((res) => {
      setBusy(false);
      // Lock as pending on any reviewed outcome; error === null means the table
      // is missing (migration not applied) and we must not claim success.
      if (res.ok || res.error === null || (res.error && /already/i.test(res.error))) {
        setAsking(false);
        setState("pending");
        return;
      }
      setProblem(res.error ?? "We could not save that claim. Please message us on WhatsApp instead.");
    });
  }

  if (state === "approved") {
    return (
      <div className="bg-navy rounded-2xl px-6 py-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-amber mb-2">
          <BadgeCheck size="14" /> Claimed
        </div>
        <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">This listing is verified to its owner.</h2>
        <p className="text-white/70 text-sm mb-5">
          The owner is verified and connected to the Klagon business owners group, so they can update this page and
          network with other businesses.
        </p>
        <a
          href={waLink(ORG_WA, buildGroupJoinMessage())}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} w-full bg-white/10 text-white border border-white/20 hover:bg-white/20`}
        >
          <Users size="16" /> Join the business owners group
        </a>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="bg-navy rounded-2xl px-6 py-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-amber mb-2">
          <ShieldCheck size="14" /> Under review
        </div>
        <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">A claim is in progress.</h2>
        <p className="text-white/70 text-sm mb-5">
          We verify ownership within 24 hours. Once approved, this listing shows a &quot;Claimed&quot; badge and the
          claim button disappears.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-navy rounded-2xl px-6 py-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-amber mb-2">
        <ShieldCheck size={14} /> Owner?
      </div>
      <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">Claim this listing — free.</h2>
      <p className="text-white/70 text-sm mb-5">
        Claimed listings get the verified badge, hours, photos and priority placement. We&apos;ll also add you to the
        Klagon business owners group for connections and networking.
      </p>

      {asking ? (
        <div data-testid="claim-form">
          <label className="block text-xs font-bold text-white/70 mb-1.5" htmlFor="claim-name">
            Your name
          </label>
          <input
            id="claim-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ama Boateng"
            className="w-full rounded-xl px-4 py-3 text-sm mb-2.5 border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-amber"
          />
          <label className="block text-xs font-bold text-white/70 mb-1.5" htmlFor="claim-phone">
            WhatsApp number
          </label>
          <input
            id="claim-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 024 000 0000"
            className="w-full rounded-xl px-4 py-3 text-sm mb-3 border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-amber"
          />
          {problem && (
            <p className="text-xs text-amber mb-3" role="alert">
              {problem}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={claim}
              disabled={busy}
              data-testid="claim-submit"
              className={`${btn} bg-amber text-navy hover:bg-amber-strong hover:text-white disabled:opacity-60`}
            >
              <MessageCircle size={16} /> {busy ? "Sending…" : "Send my claim"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAsking(false);
                setProblem(null);
              }}
              className={`${btn} bg-white/10 text-white border border-white/20 hover:bg-white/20`}
            >
              Cancel
            </button>
          </div>
          <p className="mt-3 text-[11px] text-white/50">
            Opens WhatsApp with your claim so we can verify ownership.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          data-testid="claim-start"
          className={`${btn} w-full bg-amber text-navy hover:bg-amber-strong hover:text-white`}
        >
          <MessageCircle size={16} /> Claim on WhatsApp
        </button>
      )}

      <a
        href={inviteHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} w-full bg-white/10 text-white border border-white/20 hover:bg-white/20 mt-2.5`}
      >
        <Send size={16} /> Invite the owner to claim
      </a>
      <p className="mt-4 text-[11px] text-white/50">Listing ID {b.id}. We verify ownership within 24 hours.</p>
    </div>
  );
}