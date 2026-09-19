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
} from "@/lib/directoryClaims";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors cursor-pointer font-sans";

export function DirectoryClaimPanel({ business: b }: { business: DirectoryBusiness }) {
  const [state, setState] = useState<DirectoryClaimState>("unclaimed");

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
        <ShieldCheck size="14" /> Owner?
      </div>
      <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">Claim this listing — free.</h2>
      <p className="text-white/70 text-sm mb-5">
        Claimed listings get the verified badge, hours, photos and priority placement. We&apos;ll also add you to the
        Klagon business owners group for connections and networking.
      </p>
      <a
        href={waLink(ORG_WA, buildClaimMessage({ name: b.name, id: b.id, area: b.area }))}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} w-full bg-amber text-navy hover:bg-amber-strong hover:text-white`}
      >
        <MessageCircle size="16" /> Claim on WhatsApp
      </a>
      <a
        href={inviteHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} w-full bg-white/10 text-white border border-white/20 hover:bg-white/20 mt-2.5`}
      >
        <Send size="16" /> Invite the owner to claim
      </a>
      <p className="mt-4 text-[11px] text-white/50">Listing ID {b.id}. We verify ownership within 24 hours.</p>
    </div>
  );
}