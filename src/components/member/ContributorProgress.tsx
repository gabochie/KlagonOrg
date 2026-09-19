"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

const VERIFIED_AT = 5;

export function ContributorProgress() {
  const { profile, loading } = useAuth();
  if (loading || !profile) return null;

  const approved = profile.approved_posts ?? 0;
  const verified = profile.verified_contributor ?? false;
  const pct = Math.min(100, Math.round((approved / VERIFIED_AT) * 100));

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-xs font-bold text-navy">
          {verified ? "Verified Contributor" : "Contributor progress"}
        </div>
        {verified ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber/20 text-amber-800 uppercase tracking-wider">
            Verified
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray">
            {approved}/{VERIFIED_AT} approved
          </span>
        )}
      </div>
      {!verified && (
        <div className="h-2 rounded-full bg-pale overflow-hidden mb-2">
          <div className="h-full bg-amber rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-[11px] text-gray leading-snug mb-2">
        {verified
          ? "Your posts carry the verified tick. Keep sharing — the community reads you."
          : "Get 5 posts approved to earn the verified tick on everything you share."}
      </p>
      <div className="flex gap-2">
        <Link
          href="/submit"
          className="px-2.5 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold"
        >
          Post Something →
        </Link>
        <Link
          href="/my/posts"
          className="px-2.5 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold hover:bg-pale"
        >
          My Posts
        </Link>
      </div>
    </div>
  );
}
