// ------------------------------------------------------------------
// Klagon Map — app-facing types. Mirrors the supabase schema enums.
// ------------------------------------------------------------------

export type MapEntityType =
  | "project"
  | "event"
  | "business"
  | "school"
  | "health"
  | "faith"
  | "community"
  | "facility"
  | "governance"
  | "need"
  | "sponsor"
  | "stay";

export type MapSeverity = "low" | "medium" | "high" | "critical";

export type MapLayerKey = MapEntityType;

export interface MapPoint {
  id: string;
  entity_type: MapEntityType;
  entity_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  community_area: string | null;
  severity: MapSeverity | null;
  icon: string | null;
  created_at: string;
}

export interface MapSeverityMeta {
  label: string;
  color: string;
  emoji: string;
}

export const SEVERITY_META: Record<MapSeverity, MapSeverityMeta> = {
  low: { label: "Low", color: "#F59E0B", emoji: "🟡" },
  medium: { label: "Medium", color: "#F97316", emoji: "🟠" },
  high: { label: "High", color: "#EF4444", emoji: "🔴" },
  critical: { label: "Critical", color: "#7F1D1D", emoji: "🚨" },
};

export interface MapLayerConfig {
  key: MapLayerKey;
  label: string;
  entityTypes: MapEntityType[];
  color: string;
  icon: string;
  defaultOn: boolean;
  badge?: string;
}