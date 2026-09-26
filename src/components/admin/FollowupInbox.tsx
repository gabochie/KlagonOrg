"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";
import {
  FOLLOWUP_TEMPLATES,
  firstName,
  slaBadge,
  waReplyLink,
} from "@/lib/followup";

type Donation = Database["public"]["Tables"]["donations"]["Row"];
type InKind = Database["public"]["Tables"]["inkind_offers"]["Row"];
type Contact = Database["public"]["Tables"]["contact_messages"]["Row"];
type Mentor = Database["public"]["Tables"]["mentor_applications"]["Row"];

type Tab = "donations" | "inkind" | "contact" | "mentors";

const TABS: Array<{ id: Tab; label: string; sla: number }> = [
  { id: "donations", label: "Donations", sla: 24 },
  { id: "inkind", label: "In-kind", sla: 48 },
  { id: "contact", label: "Messages", sla: 24 },
  { id: "mentors", label: "Mentors", sla: 48 },
];

const btn =
  "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 font-sans";
const primary = "bg-navy text-white hover:bg-blue";
const ghost = "border border-border bg-white text-navy hover:border-navy";

function Row({
  title,
  sub,
  age,
  slaHours,
  waHref,
  waLabel = "WhatsApp reply →",
  actions,
  badge,
}: {
  title: string;
  sub: string;
  age: string;
  slaHours: number;
  waHref: string | null;
  waLabel?: string;
  actions?: React.ReactNode;
  badge?: string;
}) {
  const sla = slaBadge(age, slaHours);
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-extrabold text-navy truncate">{title}</div>
        <div className="text-[11px] text-gray mt-0.5 break-words">{sub}</div>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              sla.overdue ? "bg-red-50 text-red-800" : "bg-light text-gray"
            }`}
          >
            {sla.overdue ? `⚠ ${sla.label}` : sla.label}
          </span>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pale text-blue-800">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={`${btn} bg-green-700 text-white hover:bg-green-800`}
          >
            {waLabel}
          </a>
        ) : (
          <span className="text-[11px] text-gray/60 px-1">no usable phone</span>
        )}
        {actions}
      </div>
    </div>
  );
}

export function FollowupInbox() {
  const [tab, setTab] = useState<Tab>("donations");
  const [donations, setDonations] = useState<Donation[]>([]);
  const [inkind, setInkind] = useState<InKind[]>([]);
  const [contact, setContact] = useState<Contact[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const c = getBrowserClient();
    if (!c) return;
    const [d, k, m, r] = await Promise.all([
      c.from("donations").select("*").order("created_at", { ascending: false }).limit(100),
      c.from("inkind_offers").select("*").order("created_at", { ascending: false }).limit(100),
      c.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
      c.from("mentor_applications").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setDonations((d.data ?? []) as Donation[]);
    setInkind((k.data ?? []) as InKind[]);
    setContact((m.data ?? []) as Contact[]);
    setMentors((r.data ?? []) as Mentor[]);
  };

  useEffect(() => {
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  const setInkindStatus = async (id: string, status: string) => {
    const c = getBrowserClient();
    if (!c || busyId) return;
    setBusyId(id);
    await c.from("inkind_offers").update({ status }).eq("id", id);
    setBusyId(null);
    await load();
  };

  const setMentorStatus = async (id: string, status: "approved" | "rejected") => {
    const c = getBrowserClient();
    if (!c || busyId) return;
    setBusyId(id);
    await c.from("mentor_applications").update({ status }).eq("id", id);
    setBusyId(null);
    await load();
  };

  const pendingCounts: Record<Tab, number> = {
    donations: donations.filter((d) => d.status === "pending").length,
    inkind: inkind.filter((k) => k.status === "pending").length,
    contact: contact.length,
    mentors: mentors.filter((m) => m.status === "pending").length,
  };

  if (loading) {
    return <div className="text-xs text-gray py-6 text-center">Loading inbox…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors border ${
              tab === t.id
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-border hover:border-navy"
            }`}
          >
            {t.label} ({pendingCounts[t.id]})
          </button>
        ))}
      </div>

      {tab === "donations" && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-gray">
            Payment status is owned by the MoMo flow — follow up here, never edit status by hand.
          </p>
          {donations.length === 0 && (
            <Empty text="No pledges yet. Donations from /donate land here." />
          )}
          {donations.map((d) => (
            <Row
              key={d.id}
              title={`${d.full_name || "Anonymous"} · GH₵${Number(d.amount_ghs).toFixed(2)}`}
              sub={`${d.status}${d.provider ? ` · ${d.provider}` : ""}${d.email ? ` · ${d.email}` : ""}`}
              age={d.created_at}
              slaHours={24}
              badge={d.status}
              waHref={waReplyLink(
                d.phone,
                FOLLOWUP_TEMPLATES.donation(
                  firstName(d.full_name),
                  Number(d.amount_ghs).toFixed(0),
                  String((d.metadata as Record<string, unknown>)?.frequency ?? "once"),
                ),
              )}
            />
          ))}
        </div>
      )}

      {tab === "inkind" && (
        <div className="space-y-2.5">
          {inkind.length === 0 && <Empty text="No in-kind offers yet." />}
          {inkind.map((k) => (
            <Row
              key={k.id}
              title={`${k.full_name} · ${k.title}`}
              sub={`${k.category}${k.description ? ` — ${k.description}` : ""}${k.email ? ` · ${k.email}` : ""}`}
              age={k.created_at}
              slaHours={48}
              badge={k.status}
              waHref={waReplyLink(k.phone, FOLLOWUP_TEMPLATES.inkind(firstName(k.full_name), k.title))}
              actions={
                k.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === k.id}
                      onClick={() => void setInkindStatus(k.id, "accepted")}
                      className={`${btn} ${primary}`}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busyId === k.id}
                      onClick={() => void setInkindStatus(k.id, "declined")}
                      className={`${btn} ${ghost}`}
                    >
                      Decline
                    </button>
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {tab === "contact" && (
        <div className="space-y-2.5">
          {contact.length === 0 && <Empty text="No messages yet." />}
          {contact.map((m) => (
            <Row
              key={m.id}
              title={`${m.full_name || m.email} · ${m.subject || "General"}`}
              sub={m.message}
              age={m.created_at}
              slaHours={24}
              waHref={waReplyLink(
                m.phone,
                FOLLOWUP_TEMPLATES.contact(firstName(m.full_name), m.subject || "your message"),
              )}
            />
          ))}
        </div>
      )}

      {tab === "mentors" && (
        <div className="space-y-2.5">
          {mentors.length === 0 && <Empty text="No mentor applications yet." />}
          {mentors.map((m) => (
            <Row
              key={m.id}
              title={`${m.full_name} · ${m.profession || "Mentor"}`}
              sub={`${(m.topics ?? []).join(", ") || "No topics"}${m.motivation ? ` — ${m.motivation}` : ""} · ${m.email}`}
              age={m.created_at}
              slaHours={48}
              badge={m.status}
              waHref={waReplyLink(m.phone, FOLLOWUP_TEMPLATES.mentor(firstName(m.full_name)))}
              actions={
                m.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void setMentorStatus(m.id, "approved")}
                      className={`${btn} ${primary}`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void setMentorStatus(m.id, "rejected")}
                      className={`${btn} ${ghost}`}
                    >
                      Reject
                    </button>
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-xs text-gray">
      {text}
    </div>
  );
}
