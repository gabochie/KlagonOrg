"use client";

// Klagon Map — data access. Follows the same guard pattern as
// src/lib/queries.ts (null client => graceful empty result so the
// static site still builds without a live Supabase project).

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { MapPoint } from "./types";

export async function fetchMapPoints(): Promise<MapPoint[]> {
  if (!isSupabaseConfigured()) return [];
  const c = getBrowserClient();
  if (!c) return [];

  const { data, error } = await c.from("map_points_public").select("*");
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    name: r.name,
    description: r.description,
    category: r.category,
    latitude: r.latitude,
    longitude: r.longitude,
    community_area: r.community_area,
    severity: r.severity,
    icon: r.icon,
    created_at: r.created_at,
  }));
}