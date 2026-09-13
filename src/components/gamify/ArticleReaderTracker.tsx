"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";

const DONE_KEY = (slug: string) => `klagon-read-${slug}`;

function computeProgress(targetId: string): number {
  const el = document.getElementById(targetId);
  if (!el) {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(100, (window.scrollY / Math.max(h, 1)) * 100));
  }
  const rect = el.getBoundingClientRect();
  const total = el.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
  return total > 0 ? Math.round((scrolled / total) * 100) : 100;
}

export function ArticleReaderTracker({ slug }: { slug: string }) {
  const { profile, refreshProfile } = useAuth();
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [promoted, setPromoted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const claimedRef = useRef(false);
  const completeRef = useRef(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = Boolean(localStorage.getItem(DONE_KEY(slug)));
    } catch {
      /* ignore */
    }
    if (stored) {
      claimedRef.current = true;
      completeRef.current = true;
      void Promise.resolve().then(() => {
        setFinished(true);
        setProgress(100);
      });
    }
  }, [slug]);

  const claim = async () => {
    if (claimedRef.current || finished) return;
    const client = getBrowserClient();
    if (!client || !profile) {
      if (profile === null) {
        setPromoted(true);
        claimedRef.current = true;
      }
      return;
    }
    claimedRef.current = true;
    const { error } = await client
      .from("reader_completions")
      .insert({ member_id: profile.id, slug });
    if (error) {
      if (typeof error === "object" && "code" in error && error.code === "23505") {
        setFinished(true);
        setProgress(100);
        try {
          localStorage.setItem(DONE_KEY(slug), "1");
        } catch {
          /* ignore */
        }
      }
      return;
    }
    setFinished(true);
    setProgress(100);
    try {
      localStorage.setItem(DONE_KEY(slug), "1");
    } catch {
      /* ignore */
    }
    setToast("+10 XP earned 🎉");
    void refreshProfile();
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (finished || claimedRef.current || completeRef.current) return;
    const onScroll = () => {
      const p = computeProgress("article-body");
      setProgress(p);
      if (p >= 90 && !completeRef.current) {
        completeRef.current = true;
        void claim();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-1 z-[70] pointer-events-none">
        <div
          className="h-full rounded-r-full transition-[width] duration-200 ease-out"
          style={{
            width: `${finished ? 100 : Math.min(progress, 100)}%`,
            background: "linear-gradient(to right, #F59E0B, #B45309)",
            boxShadow: "0 0 8px rgba(245,158,11,0.6)",
          }}
        />
      </div>

      {promoted && !finished && (
        <div className="fixed bottom-20 right-4 z-[70] rounded-xl border border-amber-300/60 bg-amber px-4 py-3 shadow-lg text-[11px] font-bold text-navy">
          Finished reading?{" "}
          <Link href="/auth/login" className="text-blue underline">
            Sign in
          </Link>{" "}
          to earn +10 XP
        </div>
      )}

      {toast && (
        <div className="xp-toast-center fixed bottom-6 left-1/2 z-[70] rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}