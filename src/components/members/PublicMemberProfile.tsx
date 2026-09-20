"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { fetchMemberPosts, fetchPublicMember, type PublicMember } from "@/lib/memberProfile";
import { POST_TYPE_LABELS } from "@/lib/posts";
import type { Post } from "@/types";

const ROLE_LABELS: Record<PublicMember["role"], string> = {
  member: "Member",
  admin: "Admin",
  super_admin: "Admin",
};

const INTEREST_LABELS: Record<string, string> = {
  business: "Business",
  jobs: "Jobs & skills",
  community: "Community",
  learning: "Learning",
  events: "Events",
  sports: "Sports",
  health: "Health",
  tech: "Tech",
  environment: "Environment",
  youth: "Youth",
};

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-white p-3">
      <div className="text-navy">{icon}</div>
      <div className="text-xl font-extrabold text-navy">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray">{label}</div>
    </div>
  );
}

export function PublicMemberProfile({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<PublicMember | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { member, error } = await fetchPublicMember(memberId);
      if (!alive) return;
      if (error || !member) {
        setNotFound(!member);
        setLoading(false);
        return;
      }
      setMember(member);
      const posts = await fetchMemberPosts(memberId);
      if (alive) setPosts(posts);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [memberId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center gap-3 text-gray">
        <Loader2 size="20" className="animate-spin" />
        <div className="text-sm font-semibold">Loading profile…</div>
      </div>
    );
  }

  if (notFound || !member) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-2xl font-extrabold text-navy mb-2">This profile isn&apos;t public yet</div>
        <p className="text-sm text-gray max-w-md mx-auto mb-6">
          Member profiles appear once a member is approved. If this is yours, sign in and check your
          dashboard.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 rounded-xl bg-amber text-navy px-5 py-3 text-sm font-bold"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const joined = new Date(member.created_at).getUTCFullYear();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <section className="bg-navy relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber/8 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row gap-5 items-start">
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatar_url}
              alt={`${member.full_name}'s avatar`}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/15"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-amber text-navy flex items-center justify-center text-xl font-extrabold">
              {initialsFor(member.full_name)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {member.full_name}
              </h1>
              <span className="rounded-full bg-white/10 text-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                {ROLE_LABELS[member.role]}
              </span>
              {member.verified_contributor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber text-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                  <BadgeCheck size="12" /> Verified contributor · 5+ posts
                </span>
              )}
            </div>
            {member.occupation && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm mb-1">
                <Briefcase size="13" /> {member.occupation}
              </div>
            )}
            {member.career_goal && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Target size="13" /> {member.career_goal}
              </div>
            )}
          </div>
        </div>
        <div className="relative mt-5 flex items-center gap-1.5 text-[11px] text-white/50">
          <Sparkles size="13" /> Member since {joined} &middot; this profile shows learn, build &amp; volunteer
          credits
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Stat icon={<Zap size="16" />} value={member.xp} label="XP" />
        <Stat icon={<Award size="16" />} value={member.approved_posts} label="Approved posts" />
        <Stat icon={<CalendarDays size="16" />} value={member.events_attended} label="Events" />
        <Stat icon={<GraduationCap size="16" />} value={member.lessons_completed} label="Lessons" />
      </section>

      {member.interests.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-white p-5">
          <div className="text-xs font-bold text-navy mb-2.5">Interested in</div>
          <div className="flex flex-wrap gap-1.5">
            {member.interests.map((i) => (
              <span
                key={i}
                className="rounded-full bg-pale px-3 py-1 text-[11px] font-bold text-navy"
              >
                {INTEREST_LABELS[i] ?? i}
              </span>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-white p-5">
          <div className="text-xs font-bold text-navy mb-3">Recently shared</div>
          <ul className="divide-y divide-border">
            {posts.slice(0, 10).map((post) => (
              <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/news/${post.id}`}
                  className="group flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-navy group-hover:text-blue transition-colors">
                      {post.title}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray mt-0.5">
                      {POST_TYPE_LABELS[post.type]}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-5 text-center text-[11px] text-gray">
        Curious how the presence works?{" "}
        <Link href="/about" className="underline decoration-amber underline-offset-2 font-bold text-navy">
          About Klagon
        </Link>{" "}
        — profiles are the community&apos;s public portfolio.
      </p>
    </div>
  );
}