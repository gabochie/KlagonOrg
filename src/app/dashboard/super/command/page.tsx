"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RequireSuperAdmin } from "@/components/auth/RequireSuperAdmin";
import { OpsCommandCenter, type CommandStatus } from "@/components/ops/OpsCommandCenter";
import { cn } from "@/lib/utils";

const READY_TIMEOUT_MS = 25000;

type Pill =
  | { tone: "idle"; label: string }
  | { tone: "ok"; label: string }
  | { tone: "busy"; label: string }
  | { tone: "bad"; label: string };

const pillStyles: Record<Pill["tone"], string> = {
  idle: "bg-light text-gray border-border",
  ok: "bg-green/10 text-green-800 border-green/25",
  busy: "bg-amber/10 text-amber-800 border-amber/25",
  bad: "bg-red-50 text-red-700 border-red-200",
};

export default function SuperCommandPage() {
  const [pill, setPill] = useState<Pill>({ tone: "idle", label: "Connecting…" });
  const [failed, setFailed] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    const t = setTimeout(() => {
      if (!readyRef.current) {
        setFailed("The Command Center took too long to start. Check your connection and reload.");
      }
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [nonce]);

  const onStatus = useCallback((s: CommandStatus) => {
    if (s.kind === "ready") {
      readyRef.current = true;
      setFailed(null);
      setPill({ tone: "ok", label: "Connected" });
    } else if (s.kind === "saving") {
      setPill({ tone: "busy", label: "Saving…" });
    } else if (s.kind === "saved") {
      const at = new Date(s.at).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
      setPill({ tone: "ok", label: `Saved ${at}` });
    } else {
      setPill({ tone: "bad", label: s.kind === "save-error" ? "Save failed" : "Load failed" });
      setFailed(s.message);
    }
  }, []);

  function reload() {
    setFailed(null);
    setPill({ tone: "idle", label: "Connecting…" });
    setNonce((n) => n + 1);
  }

  function fullscreen() {
    void wrapRef.current?.requestFullscreen?.().catch(() => {});
  }

  return (
    <RequireSuperAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2.5">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Command Center</div>
          <div className="text-xs text-gray mt-0.5">
            90-day ops engine · Super Admin only · progress saves to your account.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-full border",
              pillStyles[pill.tone],
              pill.tone === "busy" && "animate-pulse",
            )}
            role="status"
          >
            {pill.label}
          </span>
          <button
            onClick={reload}
            className="px-3 py-1.5 rounded-lg bg-white text-navy border border-border text-xs font-semibold cursor-pointer hover:bg-light transition-colors"
          >
            Reload
          </button>
          <button
            onClick={fullscreen}
            className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Full screen
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative h-[calc(100dvh-11rem)] min-h-[520px] overflow-hidden rounded-xl border border-border bg-white shadow-sm"
      >
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-xl">
                ⚠️
              </div>
              <h2 className="text-sm font-extrabold text-navy mb-1">Command Center unavailable</h2>
              <p className="text-xs text-gray leading-relaxed mb-4">{failed}</p>
              <button
                onClick={reload}
                className="px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {pill.tone === "idle" && (
              <div className="absolute inset-0 bg-white z-10 p-4" aria-hidden="true">
                <div className="h-10 w-2/3 rounded-lg bg-light animate-pulse mb-3" />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-light animate-pulse" />
                  ))}
                </div>
                <div className="mt-3 h-40 rounded-xl bg-light animate-pulse" />
              </div>
            )}
            <OpsCommandCenter key={nonce} onStatus={onStatus} />
          </>
        )}
      </div>
    </RequireSuperAdmin>
  );
}
