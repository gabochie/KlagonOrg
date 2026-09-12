"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    let active = true;
    const client = getBrowserClient();
    if (!client || !user) return;
    client
      .from("notifications")
      .select("*")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (active) setItems((data as Notification[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const unread = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    const client = getBrowserClient();
    if (!client || !user || unread === 0) return;
    await client
      .from("notifications")
      .update({ read: true })
      .eq("member_id", user.id)
      .eq("read", false);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="w-[30px] h-[30px] rounded-lg bg-white/8 flex items-center justify-center cursor-pointer"
      >
        <span className="text-sm text-white/60">🔔</span>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber border border-navy" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-96 overflow-auto bg-white rounded-xl border border-border shadow-lg p-2 z-50">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-bold text-navy">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="text-[10px] font-bold text-blue hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-gray">No notifications yet.</div>
          ) : (
            items.map((n) => (
              <a
                key={n.id}
                href={n.link ?? undefined}
                onClick={() => setOpen(false)}
                className={`block px-2.5 py-2 rounded-lg mb-0.5 transition-colors ${
                  n.read ? "hover:bg-light" : "bg-pale hover:bg-pale"
                }`}
              >
                <div className="text-xs font-bold text-navy">{n.title}</div>
                {n.body && <div className="text-[11px] text-gray leading-relaxed">{n.body}</div>}
                <div className="text-[10px] text-gray/60 mt-0.5">{timeAgo(n.created_at)}</div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}