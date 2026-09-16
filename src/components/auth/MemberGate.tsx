"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function MemberGate({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy opacity-30" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-navy" />
          </span>
          <div className="text-xs text-gray font-semibold">Checking membership…</div>
        </div>
      </main>
    );
  }

  if (!user || !profile || profile.status !== "approved") {
    const pending = user && profile && profile.status !== "approved";
    return (
      <main className="w-full">
        <section className="bg-light py-20 px-4 sm:px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center text-2xl mb-5 mx-auto">
              📚
            </div>
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">
              {pending ? "Membership pending" : "Members only"}
            </div>
            <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-navy tracking-tight leading-tight mb-3">
              {pending
                ? "Almost there — your application is in review"
                : "The Learning Hub is for KlagonOrg members"}
            </h1>
            <p className="text-sm text-gray leading-relaxed mb-6">
              {pending
                ? "A mentor will review your application shortly — usually within 24 hours. Once approved, every course and lesson unlocks here."
                : "Courses, lessons, and progress tracking are exclusive to signed-up members. Join KlagonOrg free to start learning."}
            </p>
            {pending ? (
              <Link
                href="/auth/pending"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-blue transition-colors"
              >
                Check application status →
              </Link>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-blue transition-colors"
                >
                  Create free account →
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-navy hover:border-navy transition-colors"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}