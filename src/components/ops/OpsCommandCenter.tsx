"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Json } from "@/lib/database.types";

interface KoccMsg {
  source?: string;
  type?: string;
  op?: string;
  nonce?: string;
  payload?: unknown;
}

interface KoContext {
  source: string;
  type: string;
  url: string | undefined;
  anonKey: string | undefined;
  userId: string | null;
  isAdmin: boolean;
  configured: boolean;
}

export function OpsCommandCenter() {
  const { user, isAdmin } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ctxRef = useRef<KoContext | null>(null);

  useEffect(() => {
    ctxRef.current = {
      source: "klagonops",
      type: "context",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userId: user?.id ?? null,
      isAdmin,
      configured: isSupabaseConfigured(),
    };
  }, [user, isAdmin]);

  const postTo = useCallback((msg: unknown) => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.postMessage(msg, "*");
  }, []);

  const postContext = useCallback(() => {
    if (ctxRef.current) postTo(ctxRef.current);
  }, [postTo]);

  const reply = useCallback(
    (msg: { nonce?: string; op?: string; ok: boolean; data?: unknown; error?: string }) => {
      postTo({ source: "klagonops", type: "result", ...msg });
    },
    [postTo],
  );

  const handleMessage = useCallback(
    async (e: MessageEvent<KoccMsg>) => {
      const iframe = iframeRef.current;
      if (!iframe || e.source !== iframe.contentWindow) return;
      const msg = e.data || {};
      if (msg.source !== "kocc") return;

      if (msg.type === "ready") {
        postContext();
        return;
      }

      if (msg.type !== "request") return;
      const client = getBrowserClient();
      const userId = ctxRef.current?.userId ?? null;
      const nonce = msg.nonce;

      if (msg.op === "save" && client && userId) {
        try {
          const pl = (msg.payload ?? {}) as Record<string, unknown>;
          const startDate =
            typeof pl["startDate"] === "string" ? pl["startDate"] : null;
          const savedDays =
            typeof pl["days"] === "number" ? pl["days"] : null;
          const { error } = await client
            .from("ops_kocc_snapshots")
            .upsert(
              {
                owner: userId,
                days: startDate
                  ? Math.max(
                      1,
                      Math.ceil(
                        (Date.now() - new Date(startDate).getTime()) / 86400000,
                      ),
                    )
                  : null,
                payload: pl as unknown as Json,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "owner" },
            );
          if (error) throw error;
          await client.from("ops_kocc_audit").insert({
            owner: userId,
            event: {
              kind: "save",
              at: new Date().toISOString(),
              days: savedDays,
            },
          });
          reply({ nonce, ok: true, op: "save", data: { updatedAt: new Date().toISOString() } });
        } catch (err) {
          reply({
            nonce,
            ok: false,
            op: "save",
            error: err instanceof Error ? err.message : "Save failed",
          });
        }
        return;
      }

      if (msg.op === "load" && client && userId) {
        try {
          const { data, error } = await client
            .from("ops_kocc_snapshots")
            .select("payload, updated_at")
            .eq("owner", userId)
            .maybeSingle();
          if (error) throw error;
          if (!data) {
            reply({ nonce, ok: true, op: "load", data: null });
            return;
          }
          reply({
            nonce,
            ok: true,
            op: "load",
            data: { payload: data.payload, updatedAt: data.updated_at },
          });
        } catch (err) {
          reply({
            nonce,
            ok: false,
            op: "load",
            error: err instanceof Error ? err.message : "Load failed",
          });
        }
        return;
      }

      reply({ nonce, ok: false, op: msg.op, error: "Unsupported op or not signed in" });
    },
    [postContext, reply],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <iframe
      ref={iframeRef}
      src="/ops/kocc.html"
      title="KlagonOrg Command Center"
      className="absolute inset-0 h-full w-full border-0 bg-white"
      sandbox="allow-scripts allow-same-origin"
      allow="microphone; clipboard-write"
    />
  );
}