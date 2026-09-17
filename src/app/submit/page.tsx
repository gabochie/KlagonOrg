"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PostForm } from "@/components/posts/PostForm";

function SubmitInner() {
  const params = useSearchParams();
  const editId = params.get("edit");
  return <PostForm editId={editId} />;
}

function Fallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-pulse text-sm text-gray font-semibold">Loading…</div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-light py-10 px-4">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <div className="text-[11px] font-bold tracking-widest uppercase text-amber-strong mb-1">
            Klagon Hyperlocal Portal
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Share with the community</h1>
          <p className="text-sm text-gray mt-1 max-w-md mx-auto">
            Post news, events, your business, a classified or a job. Every post is reviewed before it
            goes live, and you&apos;ll get a notification on approval.
          </p>
          <Link
            href="/my/posts"
            className="inline-block mt-3 text-xs font-bold text-blue hover:underline"
          >
            View my posts →
          </Link>
        </div>
        <Suspense fallback={<Fallback />}>
          <SubmitInner />
        </Suspense>
      </main>
    </RequireAuth>
  );
}