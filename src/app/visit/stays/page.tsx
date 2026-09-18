"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";

type StayRow = Database["public"]["Tables"]["sponsors"]["Row"];

export default function StaysPage() {
  const [stays, setStays] = useState<StayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      const c = getBrowserClient();
      if (!c) {
        setLoading(false);
        return;
      }
      const { data } = await c
        .from("sponsors")
        .select("*")
        .eq("status", "active")
        .not("stay_type", "is", null)
        .order("featured", { ascending: false });
      setStays((data ?? []) as StayRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Verified Stays
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Places to Stay in Klagon
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto">
              Guesthouses and short-stays with real photos, honest prices, and visitor reviews.
              Book direct over WhatsApp.
            </p>
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center text-sm text-gray py-10">Loading stays…</div>
            ) : stays.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-sm font-bold text-navy mb-2">First stays opening soon</div>
                <p className="text-sm text-gray mb-4">
                  Our team is visiting and verifying Klagon guesthouses now — photos, prices, and
                  honest reviews. Leave your number and we&apos;ll tell you when booking opens.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/contact">
                    <Button variant="primary">Notify Me →</Button>
                  </Link>
                  <Link href="/visit">
                    <Button variant="dark">Back to Visit →</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stays.map((s) => (
                  <Link
                    key={s.id}
                    href={`/visit/stay?id=${s.id}`}
                    className="block bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-32 bg-pale flex items-center justify-center text-3xl">
                      🛏️
                    </div>
                    <div className="p-4 sm:p-5">
                      {s.stay_type && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 mb-2">
                          {s.stay_type}
                        </span>
                      )}
                      <h2 className="text-sm font-bold text-navy leading-tight mb-1">{s.name}</h2>
                      {s.tagline && (
                        <p className="text-xs text-gray leading-relaxed mb-2">{s.tagline}</p>
                      )}
                      {s.price_range && (
                        <div className="text-sm font-extrabold text-navy">{s.price_range}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
