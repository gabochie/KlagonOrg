import type { MapEntityType, MapLayerConfig } from "./types";

// Layer definitions, one per map_point.entity_type. The color here is
// used for circle markers AND cluster count badges. Add a new layer by
// extending this list — the map renders any layer present.
export const MAP_LAYERS: MapLayerConfig[] = [
  {
    key: "project",
    label: "Projects",
    entityTypes: ["project"],
    color: "#10B981",
    icon: "🌳",
    defaultOn: true,
    badge: "Active",
  },
  {
    key: "event",
    label: "Events",
    entityTypes: ["event"],
    color: "#F59E0B",
    icon: "📅",
    defaultOn: true,
  },
  {
    key: "business",
    label: "Businesses",
    entityTypes: ["business"],
    color: "#1A2E8C",
    icon: "🏪",
    defaultOn: true,
  },
  {
    key: "school",
    label: "Schools",
    entityTypes: ["school"],
    color: "#0EA5E9",
    icon: "🏫",
    defaultOn: true,
  },
  {
    key: "health",
    label: "Health",
    entityTypes: ["health"],
    color: "#EF4444",
    icon: "🏥",
    defaultOn: true,
  },
  {
    key: "community",
    label: "Community",
    entityTypes: ["community"],
    color: "#FF6B47",
    icon: "🏠",
    defaultOn: true,
  },
  {
    key: "faith",
    label: "Faith",
    entityTypes: ["faith"],
    color: "#8B5CF6",
    icon: "⛪",
    defaultOn: false,
  },
  {
    key: "governance",
    label: "Public Services",
    entityTypes: ["governance"],
    color: "#64748B",
    icon: "🏛️",
    defaultOn: false,
  },
  {
    key: "facility",
    label: "Facilities",
    entityTypes: ["facility"],
    color: "#14B8A6",
    icon: "⚽",
    defaultOn: false,
  },
  {
    key: "need",
    label: "Community Needs",
    entityTypes: ["need"],
    color: "#DC2626",
    icon: "🚩",
    defaultOn: true,
  },
  {
    key: "sponsor",
    label: "Sponsors",
    entityTypes: ["sponsor"],
    color: "#B45309",
    icon: "🤝",
    defaultOn: false,
  },
];

export function entityTypeLabel(t: MapEntityType): string {
  return (
    MAP_LAYERS.find((l) => l.key === t)?.label ??
    t.charAt(0).toUpperCase() + t.slice(1)
  );
}

export function layerForType(t: MapEntityType): MapLayerConfig | undefined {
  return MAP_LAYERS.find((l) => l.entityTypes.includes(t));
}