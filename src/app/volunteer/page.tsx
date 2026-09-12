"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VOLUNTEER_OPPS } from "@/lib/constants";
import { Button } from "@/components/ui";

const categories = Array.from(new Set(VOLUNTEER_OPPS.map((v) => v.category)));

export default function VolunteerPage() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? VOLUNTEER_OPPS : VOLUNTEER_OPPS.filter((v) => v.category === filter);

  const [joined, setJoined] = useState<Set<string>>(new Set());

  const toggleJoin = (id: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
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
                  <h3 className="text-sm font-bold text-navy mb-1">{v.title}</h3>
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
                    onClick={() => toggleJoin(v.id)}
                    className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors ${
                      isJoined
                        ? "bg-green/10 text-green-800"
                        : "bg-navy text-white hover:bg-blue"
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
      <Footer />
    </div>
  );
}
