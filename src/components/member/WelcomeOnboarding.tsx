"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";

const STEPS = [
  {
    icon: "📚",
    title: "Start a course",
    desc: "Build job-ready skills in the Learning Hub.",
    href: "/learning",
  },
  {
    icon: "📅",
    title: "Join an event",
    desc: "Meet peers at a workshop or hackathon.",
    href: "/events",
  },
  {
    icon: "🏗️",
    title: "Volunteer on a project",
    desc: "Do real work for the community.",
    href: "/projects",
  },
  {
    icon: "🧑‍🏫",
    title: "Find a mentor",
    desc: "Get guidance from someone who's been there.",
    href: "/mentor",
  },
];

export function WelcomeOnboarding() {
  const { profile, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!profile || profile.onboarded_at || dismissed) return null;

  const firstName = profile.full_name.trim().split(/\s+/)[0] ?? "there";

  const dismiss = async () => {
    const client = getBrowserClient();
    if (client) {
      await client
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
    setDismissed(true);
    await refreshProfile();
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-amber via-coral to-amber/40" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-base font-extrabold text-navy">
              Welcome to KlagonOrg, {firstName}! 🎉
            </div>
            <p className="text-xs text-gray mt-1 max-w-md">
              Here are the fastest ways to earn XP and become part of the community.
            </p>
          </div>
          <div className="bg-amber/15 border border-amber/30 rounded-lg px-3 py-1.5 text-center">
            <div className="text-lg font-extrabold text-amber">+10</div>
            <div className="text-[9px] font-semibold text-navy/60">Welcome XP</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
          {STEPS.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex items-center gap-3 rounded-lg border border-border bg-light p-3 hover:border-navy transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-base flex-shrink-0">
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy">{s.title}</div>
                <div className="text-[10px] text-gray leading-snug">{s.desc}</div>
              </div>
              <span className="ml-auto text-gray flex-shrink-0">→</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => void dismiss()}
            className="px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:bg-blue transition-colors font-sans"
          >
            Start exploring
          </button>
          <button
            onClick={() => void dismiss()}
            className="px-4 py-2 rounded-lg border border-border text-xs font-bold text-navy hover:border-navy transition-colors cursor-pointer font-sans"
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}