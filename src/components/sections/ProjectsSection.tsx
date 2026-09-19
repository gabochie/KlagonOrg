"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchPublicProjects,
  fetchMyVolunteerProjectIds,
  toggleVolunteer,
  isUuid,
} from "@/lib/queries";
import type { Project } from "@/types";

export function ProjectsSection() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const live = await fetchPublicProjects();
      setProjects(live);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    void fetchMyVolunteerProjectIds(profile.id).then((ids) => setJoined(new Set(ids)));
  }, [profile?.id]);

  const toggle = async (id: string) => {
    if (!profile) {
      setNotice("Sign in to join a project.");
      return;
    }
    if (!isUuid(id)) return;
    const isJoining = !joined.has(id);
    setJoined((prev) => {
      const next = new Set(prev);
      if (isJoining) next.add(id);
      else next.delete(id);
      return next;
    });
    await toggleVolunteer(profile.id, id, isJoining);
    const ids = await fetchMyVolunteerProjectIds(profile.id);
    setJoined(new Set(ids));
    setNotice(null);
  };

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Community Projects
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Build things that actually help Klagon.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Join active projects, volunteer your skills, and see the direct impact on your community
            — all tracked on your profile.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {notice && (
            <div className="mb-6 text-xs font-semibold bg-amber/10 text-navy rounded-lg px-4 py-3">
              {notice}{" "}
              <Link href="/auth/login" className="font-bold text-blue hover:underline">
                Sign in →
              </Link>
            </div>
          )}
          {loaded && projects.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-8 sm:p-10 text-center max-w-lg mx-auto">
              <div className="text-sm font-bold text-navy mb-1">Projects are being set up.</div>
              <p className="text-sm text-gray leading-relaxed mb-4">
                The first Klagon community build days are being scheduled. Join free and we&apos;ll
                notify you the moment you can volunteer.
              </p>
              <Link href="/auth/register">
                <span className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors">
                  Join Free — Get Notified →
                </span>
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-border p-5 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: p.color }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-navy">{p.title}</h2>
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        p.status === "active"
                          ? "bg-green/10 text-green-800"
                          : "bg-amber/10 text-amber-800"
                      }`}
                    >
                      {p.status === "active" ? "● Active" : "○ Recruiting"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray leading-relaxed mb-4">{p.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-gray">
                    <span className="w-2 h-2 rounded-full bg-green" />
                    {p.volunteers} volunteers · {p.spotsOpen} spots open
                  </div>
                  <button
                    onClick={() => void toggle(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors ${
                      joined.has(p.id) ? "bg-green/10 text-green-800" : "bg-navy text-white hover:bg-blue"
                    }`}
                  >
                    {joined.has(p.id) ? "✓ Joined" : "Join"}
                  </button>
                </div>
                {p.progress > 0 && (
                  <div className="mt-3 h-1.5 bg-pale rounded-full overflow-hidden">
                    <div className="h-full bg-green" style={{ width: `${p.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}