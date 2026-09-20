"use client";

import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export function PublicProfileLink() {
  const { profile, loading } = useAuth();
  if (loading || !profile) return null;
  return (
    <Link
      href={`/people/${profile.id}`}
      className="block bg-white rounded-xl border border-border p-4 hover:border-amber transition-colors"
    >
      <div className="text-sm font-extrabold text-navy">My public profile &rarr;</div>
      <div className="text-[11px] text-gray mt-0.5">
        The portfolio the community sees — XP, posts, credits
      </div>
    </Link>
  );
}