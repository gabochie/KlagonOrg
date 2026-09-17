"use client";

// ------------------------------------------------------------------
// Klagon Hyperlocal Community Portal — Supabase Storage helper
// Bucket: post-media (public read; authenticated users write to own
// folder). Path convention: {userId}/{timestamp}-{slug}.{ext}
// Mirrors src/lib/posts.ts / src/lib/supabase-browser.ts conventions.
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";

export const POST_MEDIA_BUCKET = "post-media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^./\\]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

function extOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return byType[file.type] ?? "jpg";
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Please upload a JPG, PNG, WEBP or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Images must be smaller than ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`;
  }
  return null;
}

/** Upload a single image to post-media. Returns the public URL on success. */
export async function uploadPostMedia(file: File, userId: string): Promise<UploadResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured." };
  const c = getBrowserClient();
  if (!c) return { ok: false, error: "Supabase is not configured." };

  const invalid = validateImage(file);
  if (invalid) return { ok: false, error: invalid };

  const path = `${userId}/${Date.now()}-${slugify(file.name)}.${extOf(file)}`;

  const { error } = await c.storage.from(POST_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = c.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

/** Upload several images sequentially (keeps ordering stable for galleries). */
export async function uploadPostMediaMany(files: File[], userId: string): Promise<UploadResult[]> {
  const out: UploadResult[] = [];
  for (const file of files) out.push(await uploadPostMedia(file, userId));
  return out;
}

export async function deletePostMedia(path: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured." };
  const c = getBrowserClient();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.storage.from(POST_MEDIA_BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
