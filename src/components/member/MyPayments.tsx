"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";
import { Receipt } from "lucide-react";

type Row = {
  kind: "Course" | "Boost";
  title: string;
  amount: number | null;
  date: string;
  href: string;
};

/**
 * Member payment history: every course entitlement + every boost on the
 * member's own posts, with amounts and dates. RLS already scopes both reads
 * to the signed-in member (own entitlements, own posts), so there is nothing
 * here a stranger can see. Donations/sponsorships stay admin-visible only
 * (no member key on those rows) — courses and boosts are what members pay
 * for themselves.
 */
export function MyPayments() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!profile?.id) {
        setLoaded(true);
        return;
      }
      const c = getBrowserClient();
      if (!c) {
        setLoaded(true);
        return;
      }
      const out: Row[] = [];
      const { data: ents } = await c
        .from("course_entitlements")
        .select("granted_at, course_id, courses(title, price_ghs)")
        .eq("member_id", profile.id)
        .order("granted_at", { ascending: false });
      for (const e of (ents ?? []) as {
        granted_at: string;
        course_id: string;
        courses: { title: string; price_ghs: number | null } | null;
      }[]) {
        out.push({
          kind: "Course",
          title: e.courses?.title ?? "Course",
          amount: e.courses?.price_ghs ?? null,
          date: e.granted_at,
          href: `/learning/${e.course_id}`,
        });
      }
      const { data: boosts } = await c
        .from("boost_payments")
        .select("paid_at, amount_ghs, post_id, posts(title)")
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(20);
      for (const b of (boosts ?? []) as {
        paid_at: string;
        amount_ghs: number | null;
        post_id: string;
        posts: { title: string } | null;
      }[]) {
        out.push({
          kind: "Boost",
          title: b.posts?.title ?? "Listing boost",
          amount: b.amount_ghs,
          date: b.paid_at,
          href: "/my/posts",
        });
      }
      out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setRows(out.slice(0, 10));
      setLoaded(true);
    })();
  }, [profile?.id]);

  if (!loaded) return <div className="text-xs text-gray">Loading payments…</div>;
  if (rows.length === 0) {
    return (
      <div>
        <div className="text-sm font-extrabold text-navy mb-1">My payments</div>
        <p className="text-xs text-gray">
          Nothing paid yet.{" "}
          <Link href="/learning" className="font-bold text-blue hover:underline">
            Browse courses →
          </Link>
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="text-sm font-extrabold text-navy mb-2">My payments</div>
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={`${r.kind}-${r.date}-${i}`}>
            <Link
              href={r.href}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 hover:border-amber transition-colors"
            >
              <Receipt size={15} className="text-amber-strong flex-shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-navy truncate">{r.title}</span>
                <span className="block text-[11px] text-gray">
                  {r.kind} · {new Date(r.date).toLocaleDateString("en-GH")}
                </span>
              </span>
              <span className="text-xs font-extrabold text-navy whitespace-nowrap">
                {r.amount != null ? `GH₵ ${Number(r.amount).toLocaleString("en-GH")}` : "—"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
