"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MyPostsList } from "@/components/posts/MyPostsList";

export default function MyPostsPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-light py-10 px-4">
        <div className="max-w-2xl mx-auto mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-amber-strong mb-1">
              My posts
            </div>
            <h1 className="text-2xl font-extrabold text-navy">Your submissions</h1>
            <p className="text-sm text-gray mt-1">
              Track the review status of everything you&apos;ve posted.
            </p>
          </div>
          <Link
            href="/submit"
            className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
          >
            + New post
          </Link>
        </div>
        <div className="max-w-2xl mx-auto">
          <MyPostsList />
        </div>
      </main>
    </RequireAuth>
  );
}