"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VolunteerApplicationForm } from "@/components/volunteer/VolunteerApplicationForm";

export function VolunteerApplyContent() {
  const params = useSearchParams();
  const role = (params.get("role") ?? "").trim();
  const post = (params.get("post") ?? "").trim();

  if (!role) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-center">
        <div className="text-sm font-extrabold text-navy mb-1">Choose a role first</div>
        <p className="text-xs text-gray mb-3">
          Applications start from a specific volunteer role.
        </p>
        <Link
          href="/volunteer"
          className="inline-flex rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-blue transition-colors"
        >
          Browse volunteer roles →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight mb-1">
        Apply: {role}
      </h1>
      <p className="text-white/60 text-sm max-w-lg mb-6">
        Unpaid role · 30-day probation · continuation depends on performance. ID verification
        required.
      </p>
      <VolunteerApplicationForm role={role} postId={post || null} />
    </div>
  );
}
