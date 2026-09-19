"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { ANNOUNCEMENTS } from "@/lib/constants";
import { DemoTag } from "@/components/ui";

interface Announcement {
  id: string | number;
  title: string;
  body: string;
  created_at?: string;
}

const MOCK = ANNOUNCEMENTS.map((a) => ({
  id: a.id,
  title: a.title,
  body: a.body,
  created_at: a.time,
}));

export function Announcements() {
  const [items, setItems] = useState<Announcement[]>(MOCK);
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    const client = getBrowserClient();
    if (!client || !isSupabaseConfigured()) return;
    void (async () => {
      const { data, error } = await client
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (!error && data && data.length > 0) {
        setItems(data);
        setDemo(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy flex items-center gap-2">
          Announcements {demo && <DemoTag />}
        </div>
        <Link href="/news" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
          View All →
        </Link>
      </div>
      {items.map((a) => (
        <div key={a.id} className="flex gap-2.5 py-2 border-b border-border last:border-b-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1 bg-amber" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-navy">{a.title}</div>
            <div className="text-[11px] text-gray leading-relaxed">{a.body}</div>
            {a.created_at && (
              <div className="text-[10px] text-gray mt-0.5">
                {new Date(a.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}