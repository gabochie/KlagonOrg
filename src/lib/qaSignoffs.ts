import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { checkId, type CheckedMap } from "@/lib/quality";

export interface SignoffRow {
  area_id: string;
  check_index: number;
  checked: boolean;
}

/** Remote rows → CheckedMap. Only checked rows are kept. */
export function rowsToChecked(rows: SignoffRow[]): CheckedMap {
  const out: CheckedMap = {};
  for (const r of rows) {
    if (!r || typeof r.area_id !== "string" || typeof r.check_index !== "number") continue;
    if (r.checked) out[checkId(r.area_id, r.check_index)] = true;
  }
  return out;
}

/** Shared truth across staff/devices. Empty map when unconfigured or unreadable. */
export async function fetchSignoffs(): Promise<CheckedMap> {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await getBrowserClient()
    .from("qa_signoffs")
    .select("area_id, check_index, checked");
  if (error || !data) return {};
  return rowsToChecked(data as SignoffRow[]);
}

/** Toggle one check in the shared record. Returns an error message or null. */
export async function writeSignoff(
  areaId: string,
  index: number,
  checked: boolean,
  by: string | null
): Promise<string | null> {
  if (!isSupabaseConfigured()) return "Supabase is not configured.";
  const { error } = await getBrowserClient()
    .from("qa_signoffs")
    .upsert(
      {
        area_id: areaId,
        check_index: index,
        checked,
        checked_by: by,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "area_id,check_index" }
    );
  return error ? error.message : null;
}

/** Wipe the shared record (release reset). Returns an error message or null. */
export async function clearSignoffs(): Promise<string | null> {
  if (!isSupabaseConfigured()) return "Supabase is not configured.";
  const { error } = await getBrowserClient()
    .from("qa_signoffs")
    .delete()
    .gte("check_index", 0);
  return error ? error.message : null;
}
