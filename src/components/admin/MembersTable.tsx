"use client";

import { useEffect, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { ADMIN_MEMBERS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type Filter = "All" | "Pending" | "Approved" | "Rejected";

interface MockMember {
  name: string;
  email: string;
  age: number;
  interests: string[];
  joined: string;
  status: string;
  color: string;
  textColor: string;
  initials: string;
}

interface DisplayMember {
  id: string;
  name: string;
  email: string;
  age: number | null;
  interests: string[];
  joined: string;
  status: string;
  avatarBg: string;
  textColor: string;
  initials: string;
}

const toDisplay = (p: ProfileRow): DisplayMember => {
  const firstName = p.full_name.trim().split(/\s+/)[0] ?? "?";
  const lastName = p.full_name.trim().split(/\s+/).slice(1).join(" ") || "";
  return {
    id: p.id,
    name: p.full_name,
    email: p.email,
    age: p.age,
    interests: p.interests,
    joined: new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    status: p.status,
    avatarBg: "linear-gradient(135deg,#0F1B5C,#1A2E8C)",
    textColor: "#fff",
    initials: ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase(),
  };
};

const mockToDisplay = (m: MockMember): DisplayMember => ({
  id: m.email,
  name: m.name,
  email: m.email,
  age: m.age,
  interests: m.interests,
  joined: m.joined,
  status: m.status,
  avatarBg: m.color,
  textColor: m.textColor,
  initials: m.initials,
});

const statusPill = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green/10 text-green-800";
    case "pending":
      return "bg-amber/10 text-amber-800";
    case "rejected":
      return "bg-red/10 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export function MembersTable() {
  const fallback = (ADMIN_MEMBERS as MockMember[]).map(mockToDisplay);
  const client = getBrowserClient();
  const configured = Boolean(client) && isSupabaseConfigured();

  const [filter, setFilter] = useState<Filter>("All");
  const [members, setMembers] = useState<DisplayMember[]>(fallback);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!client || !configured) return;
    let cancelled = false;
    void client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLoading(false);
          return;
        }
        setMembers(data.map(toDisplay));
        setLive(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, configured]);

  const setStatus = async (id: string, status: ProfileRow["status"]) => {
    const client = getBrowserClient();
    if (!client) return;
    await client.from("profiles").update({ status }).eq("id", id);
    void client.rpc("log_audit", {
      p_action: `member_${status}`,
      p_entity: "profiles",
      p_entity_id: id,
    });
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const filtered =
    filter === "All" ? members : members.filter((m) => m.status === filter.toLowerCase());

  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-bold text-navy">Recent Members</div>
          <div className="text-[11px] text-gray">
            {live
              ? `${members.length} total · ${pendingCount} awaiting approval`
              : "Demo data — connect Supabase to view live members"}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Pending", "Approved", "Rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer font-sans transition-colors ${
                filter === f
                  ? "bg-navy text-white"
                  : "border border-border text-gray bg-white hover:border-navy"
              }`}
            >
              {f}
              {f === "Pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="p-6 text-xs text-gray font-semibold">Loading members…</div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-xs text-gray font-semibold">No members in this view.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-light">
                {["Member", "Age", "Interests", "Joined", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-[10px] font-bold text-gray uppercase tracking-wider text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-light/50 transition-colors">
                  <td className="px-3 py-2.5 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: m.avatarBg, color: m.textColor }}
                      >
                        {m.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy">{m.name}</div>
                        <div className="text-[11px] text-gray">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border text-xs text-gray">
                    {m.age ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {(m.interests ?? []).slice(0, 3).map((i) => (
                      <span
                        key={i}
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pale text-blue-800 mr-1"
                      >
                        {i}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border text-xs text-gray">{m.joined}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPill(m.status)}`}
                    >
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {m.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => void setStatus(m.id, "approved")}
                          className="px-2 py-1 rounded-lg bg-green text-white text-[11px] font-semibold cursor-pointer font-sans hover:bg-green/90 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void setStatus(m.id, "rejected")}
                          className="px-2 py-1 rounded-lg border border-border text-[11px] font-semibold text-navy bg-white cursor-pointer font-sans hover:bg-light transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray font-semibold">
                        {m.status === "approved" ? "Active" : "Not approved"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}