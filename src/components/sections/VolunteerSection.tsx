"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VOLUNTEER_OPPS } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { VolunteerOpenRoles } from "@/components/volunteer/VolunteerOpenRoles";
import {
  fetchMyVolunteerApplications,
  type VolunteerApplication,
} from "@/lib/volunteers";

const categories = Array.from(new Set(VOLUNTEER_OPPS.map((v) => v.category)));

const STATUS_LABEL: Record<string, string> = {
  pending: "Applied · under review",
  probationary: "On probation",
  active: "On the team 🎉",
  inactive: "Ended",
  rejected: "Not successful",
};

export function VolunteerSection() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState("All");
  const [myApps, setMyApps] = useState<VolunteerApplication[]>([]);

  const filtered =
    filter === "All" ? VOLUNTEER_OPPS : VOLUNTEER_OPPS.filter((v) => v.category === filter);

  useEffect(() => {
    if (!profile?.id) {
      void Promise.resolve([]).then(setMyApps);
      return;
    }
    void fetchMyVolunteerApplications(profile.id).then(setMyApps);
  }, [profile?.id]);

  const appFor = (role: string) =>
    myApps.find((a) => a.post_id === null && a.role === role) ?? null;

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
            Every skill you have can help someone in Klagon. Roles are unpaid with a 30-day
            probation — continuation depends on performance.{" "}
            <Link href="/volunteer/terms" className="font-bold text-amber hover:underline">
              Read the terms
            </Link>
            .
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <VolunteerOpenRoles />
          <h2 className="text-base font-extrabold text-navy mb-1">General roles</h2>
          <p className="text-xs text-gray mb-4">
            Ongoing areas where we always welcome help — apply and we will match you.
          </p>
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
          <div className="mb-6 text-xs text-gray bg-pale rounded-lg px-4 py-3">
            Applying requires ID verification (Ghana Card + photo) and acceptance of the{" "}
            <Link href="/volunteer/terms" className="font-bold text-blue hover:underline">
              Volunteer Terms
            </Link>
            . Approved volunteers join a 30-day probation.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const app = profile ? appFor(v.title) : null;
              const open = app && ["pending", "probationary", "active"].includes(app.status);
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
                  <p className="text-xs text-gray leading-relaxed mb-4">{v.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray mb-4">
                    <span className="font-semibold text-navy">{v.commitment}</span>
                  </div>
                  {open && app ? (
                    <div
                      className={`w-full py-2 rounded-lg text-xs font-bold text-center ${
                        app.status === "active"
                          ? "bg-green/10 text-green-800"
                          : "bg-amber/10 text-navy"
                      }`}
                    >
                      {STATUS_LABEL[app.status] ?? app.status}
                    </div>
                  ) : (
                    <Link
                      href={`/volunteer/apply?role=${encodeURIComponent(v.title)}`}
                      className="block text-center w-full py-2 rounded-lg text-xs font-bold bg-navy text-white hover:bg-blue transition-colors"
                    >
                      Apply now
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
