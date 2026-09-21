"use client";

import { useEffect, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { UserRole } from "@/lib/database.types";
import { useAuth } from "@/components/auth/AuthProvider";

interface Row {
  id: string;
  full_name: string | null;
  role: UserRole;
  status: string | null;
  created_at: string | null;
}

const ROLES: UserRole[] = ["member", "admin", "super_admin"];

export function RoleManager() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) return;
    void c
      .from("profiles")
      .select("id, full_name, role, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) setRows(data as Row[]);
        else if (error) setNotice(`Could not load members: ${error.message}`);
      });
  }, []);

  async function setRole(row: Row, role: UserRole) {
    if (role === row.role || !profile || row.id === profile.id) return;
    setBusy(row.id);
    setNotice(null);
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setNotice("Supabase is not configured.");
      setBusy(null);
      return;
    }
    const { error } = await c.rpc("set_member_role", {
      p_user_id: row.id,
      p_role: role,
    });
    if (error) {
      setNotice(`Role change failed: ${error.message}`);
    } else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, role } : r)));
      setNotice(`${row.full_name || row.id} is now ${role.replace("_", " ")}.`);
    }
    setBusy(null);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="text-sm font-extrabold text-navy">Roles</div>
      <div className="text-[11px] text-gray mt-0.5 mb-3">
        Only super admins can change roles — enforced in the database, not just here.
        You cannot change your own role.
      </div>
      {notice && (
        <div className="mb-3 text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2">
          {notice}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold text-navy truncate">
                {r.full_name || "(no name)"}
              </div>
              <div className="text-[10px] text-gray">
                {r.status ?? ""} · joined{" "}
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
              </div>
            </div>
            <select
              value={r.role}
              disabled={busy === r.id || (profile ? r.id === profile.id : false)}
              onChange={(e) => void setRole(r, e.target.value as UserRole)}
              className="rounded-lg border border-border px-2 py-1 text-xs font-bold text-navy bg-light disabled:opacity-50"
              aria-label={`Role for ${r.full_name || r.id}`}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-6 text-center text-xs text-gray">No members loaded.</div>
        )}
      </div>
    </div>
  );
}
