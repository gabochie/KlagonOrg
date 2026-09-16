"use client";

import { useState } from "react";
import { VOLUNTEER_OPPS } from "@/lib/constants";
import { getBrowserClient } from "@/lib/supabase-browser";

const categories = Array.from(new Set(VOLUNTEER_OPPS.map((v) => v.category)));

const OPP_PROJECT: Record<string, string> = {
  "Tree-Planting Volunteer": "d57a554e-cd8d-4c6b-bf4f-0ba1941dd6ff",
  "Digital Literacy Tutor": "aedddf00-63b1-469d-9ce6-79dc5d60811d",
};

export function VolunteerSection() {
  const [filter, setFilter] = useState("All");
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const filtered =
    filter === "All" ? VOLUNTEER_OPPS : VOLUNTEER_OPPS.filter((v) => v.category === filter);

  const toggleJoin = async (opp: { id: string; title: string }) => {
    if (joined.has(opp.id)) return;
    const client = getBrowserClient();
    if (!client || !client.auth.getUser) {
      setNotice("Sign in to volunteer. Registration for new roles requires an account.");
      return;
    }
    const { data: sessionData } = await client.auth.getSession();
    const memberId = sessionData.session?.user.id;
    if (!memberId) {
      setNotice("Sign in to volunteer. Registration for new roles requires an account.");
      return;
    }
    const projectId = OPP_PROJECT[opp.title] ?? null;
    const { data: prof } = await client
      .from("profiles")
      .select("full_name,phone,email")
      .eq("id", memberId)
      .single();
    const { error: signupErr } = await client.from("volunteer_signups").insert({
      project_id: projectId,
      member_id: memberId,
      role: opp.title,
      full_name: prof?.full_name ?? null,
      phone: prof?.phone ?? null,
      email: prof?.email ?? null,
    });
    if (signupErr) {
      setNotice("Could not sign up. Please try again.");
      return;
    }
    if (projectId) {
      await client.from("project_volunteers").upsert(
        { project_id: projectId, member_id: memberId },
        { onConflict: "project_id,member_id", ignoreDuplicates: true }
      );
    }
    setJoined((prev) => new Set(prev).add(opp.id));
    setNotice(null);
  };

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Volunteer
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Give your time. Make an impact.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Every skill you have can help someone in Klagon. Find a volunteer role that matches your
            interests and availability.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => setFilter("All")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
                filter === "All"
                  ? "bg-navy text-white"
                  : "bg-white text-gray border border-border hover:border-navy"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
                  filter === cat
                    ? "bg-navy text-white"
                    : "bg-white text-gray border border-border hover:border-navy"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {notice && (
            <div className="mb-6 text-xs font-semibold bg-amber/10 text-navy rounded-lg px-4 py-3">
              {notice}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const isJoined = joined.has(v.id);
              return (
                <div
                  key={v.id}
                  className="bg-white rounded-xl border border-border p-5 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3"
                    style={{ background: v.color }}
                  >
                    {v.icon}
                  </div>
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pale text-blue-800 mb-2">
                    {v.category}
                  </span>
                  <h2 className="text-sm font-bold text-navy mb-1">{v.title}</h2>
                  <p className="text-xs text-gray leading-relaxed mb-3">{v.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray mb-3">
                    <span className="font-semibold text-navy">{v.commitment}</span>
                    <span>·</span>
                    <span>
                      {v.spotsLeft} of {v.spots} spots left
                    </span>
                  </div>
                  <div className="h-1.5 bg-light rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{ width: `${((v.spots - v.spotsLeft) / v.spots) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => void toggleJoin(v)}
                    className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors ${
                      isJoined ? "bg-green/10 text-green-800" : "bg-navy text-white hover:bg-blue"
                    }`}
                  >
                    {isJoined ? "✓ Signed Up" : "Sign Up"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}