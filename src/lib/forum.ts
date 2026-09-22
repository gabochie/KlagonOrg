"use client";

// ------------------------------------------------------------------
// Community Forum — query layer
// Mirrors src/lib/posts.ts conventions (browser Supabase client,
// graceful empty fallbacks when Supabase is not configured).
// Backing schema: supabase/migrations/20260922000000_forum.sql
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";

type BoardRow = Database["public"]["Tables"]["forum_boards"]["Row"];
type ThreadRow = Database["public"]["Tables"]["forum_threads"]["Row"];
type PostRow = Database["public"]["Tables"]["forum_posts"]["Row"];

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

export interface ForumAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ForumBoard {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
  threadCount: number;
}

export interface ForumThread {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  body: string;
  pinned: boolean;
  closed: boolean;
  replyCount: number;
  lastReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor | null;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor | null;
}

export interface ForumResult {
  ok: boolean;
  id?: string;
  error?: string;
}

// ------------------------------------------------------------------
// authors
// ------------------------------------------------------------------

async function fetchAuthors(ids: string[]): Promise<Map<string, ForumAuthor>> {
  const c = client();
  const map = new Map<string, ForumAuthor>();
  if (!c || ids.length === 0) return map;
  const { data, error } = await c
    .from("profiles_public")
    .select("id,full_name,avatar_url")
    .in("id", ids);
  if (error || !data) return map;
  for (const p of data) {
    map.set(p.id, {
      id: p.id,
      name: p.full_name ?? "Community Member",
      avatarUrl: p.avatar_url,
    });
  }
  return map;
}

// ------------------------------------------------------------------
// public reads
// ------------------------------------------------------------------

export async function fetchBoards(): Promise<ForumBoard[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("forum_boards")
    .select("*")
    .order("position", { ascending: true });
  if (error || !data) return [];

  const { data: threadRows, error: tErr } = await c
    .from("forum_threads")
    .select("board_id")
    .eq("status", "visible");
  if (tErr || !threadRows) {
    return data.map((b) => ({ ...b, threadCount: 0 }));
  }

  const counts = new Map<string, number>();
  for (const t of threadRows) counts.set(t.board_id, (counts.get(t.board_id) ?? 0) + 1);

  return data
    .map((b) => ({ ...b, threadCount: counts.get(b.id) ?? 0 }))
    .sort((a, b) => a.position - b.position);
}

export async function fetchThreads(boardId: string): Promise<ForumThread[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("forum_threads")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "visible")
    .order("pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error || !data) return [];

  const authors = await fetchAuthors([...new Set(data.map((t) => t.author_id))]);
  return data.map((t) => ({
    id: t.id,
    boardId: t.board_id,
    authorId: t.author_id,
    title: t.title,
    body: t.body,
    pinned: t.pinned,
    closed: t.closed,
    replyCount: t.reply_count,
    lastReplyAt: t.last_reply_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    author: authors.get(t.author_id) ?? null,
  }));
}

/** Single thread (visible) + its replies, oldest first. */
export async function fetchThread(threadId: string): Promise<{
  thread: ForumThread | null;
  replies: ForumReply[];
}> {
  const c = client();
  if (!c) return { thread: null, replies: [] };
  const { data: t, error } = await c
    .from("forum_threads")
    .select("*")
    .eq("id", threadId)
    .eq("status", "visible")
    .maybeSingle();
  if (error || !t) return { thread: null, replies: [] };

  const { data: replies, error: rErr } = await c
    .from("forum_posts")
    .select("*")
    .eq("thread_id", threadId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });
  if (rErr || !replies) return { thread: mapThread(t, null), replies: [] };

  const authorIds = [...new Set([t.author_id, ...replies.map((p) => p.author_id)])];
  const authors = await fetchAuthors(authorIds);
  return {
    thread: mapThread(t, authors.get(t.author_id) ?? null),
    replies: replies.map((p) => ({
      id: p.id,
      threadId: p.thread_id,
      authorId: p.author_id,
      body: p.body,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      author: authors.get(p.author_id) ?? null,
    })),
  };
}

function mapThread(t: ThreadRow, author: ForumAuthor | null): ForumThread {
  return {
    id: t.id,
    boardId: t.board_id,
    authorId: t.author_id,
    title: t.title,
    body: t.body,
    pinned: t.pinned,
    closed: t.closed,
    replyCount: t.reply_count,
    lastReplyAt: t.last_reply_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    author,
  };
}

// ------------------------------------------------------------------
// member writes
// ------------------------------------------------------------------

export async function createThread(
  boardId: string,
  title: string,
  body: string,
  memberId: string
): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await c
    .from("forum_threads")
    .insert({
      board_id: boardId,
      author_id: memberId,
      title: title.trim(),
      body: body.trim(),
      status: "visible",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function updateThread(
  threadId: string,
  patch: { title?: string; body?: string }
): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const update: Database["public"]["Tables"]["forum_threads"]["Update"] = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.body !== undefined) update.body = patch.body.trim();
  const { error } = await c.from("forum_threads").update(update).eq("id", threadId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: threadId };
}

export async function deleteThread(threadId: string): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("forum_threads").delete().eq("id", threadId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: threadId };
}

export async function createReply(
  threadId: string,
  body: string,
  memberId: string
): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await c
    .from("forum_posts")
    .insert({ thread_id: threadId, author_id: memberId, body: body.trim(), status: "visible" })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function deleteReply(replyId: string): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("forum_posts").delete().eq("id", replyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: replyId };
}

// ------------------------------------------------------------------
// moderation (admin)
// ------------------------------------------------------------------

/** Pin / close / hide (status='hidden') — staff only. */
export async function modThread(
  threadId: string,
  patch: { pinned?: boolean; closed?: boolean; status?: "visible" | "hidden" }
): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const update: Database["public"]["Tables"]["forum_threads"]["Update"] = {};
  if (patch.pinned !== undefined) update.pinned = patch.pinned;
  if (patch.closed !== undefined) update.closed = patch.closed;
  if (patch.status !== undefined) update.status = patch.status;
  const { error } = await c.from("forum_threads").update(update).eq("id", threadId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: threadId };
}

export async function modReply(
  replyId: string,
  status: "visible" | "hidden"
): Promise<ForumResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("forum_posts").update({ status }).eq("id", replyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: replyId };
}