"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordLeadEvent } from "@/lib/analytics";
import { Button, Input } from "@/components/ui";
import { ShieldCheck, XCircle, Printer } from "lucide-react";
import { CertificatePrint } from "@/components/verify/CertificatePrint";

interface CertResult {
  code: string;
  recipient_name: string;
  course_title: string;
  issued_at: string;
  revoked: boolean;
  member_id: string;
}

export function VerifyContent() {
  const params = useSearchParams();
  const { profile } = useAuth();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertResult | null>(null);
  const [missed, setMissed] = useState(false);
  const autoRan = useRef(false);

  async function lookup(e?: React.FormEvent, override?: string) {
    e?.preventDefault();
    setError(null);
    setResult(null);
    setMissed(false);
    const clean = (override ?? code).trim().toUpperCase();
    if (!clean) return setError("Enter the certificate code, e.g. KLG-AU-9F3C2B.");
    setBusy(true);
    try {
      const client = getBrowserClient();
      if (!client) return setError("Verification service unavailable. Try again later.");
      const { data, error: rpcError } = await client.rpc("verify_certificate", { p_code: clean });
      if (rpcError) return setError(rpcError.message);
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) {
        setMissed(true);
        recordLeadEvent({ source: "verify", action: "miss", metadata: { code: clean.slice(0, 20) } });
        return;
      }
      setResult(row);
      recordLeadEvent({ source: "verify", action: "hit" });
    } finally {
      setBusy(false);
    }
  }

  // Deep links (?code=KLG-XX-XXXXXX) from notifications and employer
  // shares verify immediately — no extra click. Deferred to a timeout so no
  // state updates run synchronously inside the effect body.
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const preset = params.get("code");
    if (preset && preset.trim()) {
      const t = window.setTimeout(() => void lookup(undefined, preset), 0);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Certificate verification
          </div>
          <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-white tracking-tight mb-3">
            Is this KLAGON certificate real?
          </h1>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Every certificate issued after project review carries a verifiable ID.
            Enter it below — employers welcome.
          </p>
        </div>
      </section>
      <section className="bg-light py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          <form
            onSubmit={lookup}
            className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4"
          >
            <Input
              id="verify-code"
              label="Certificate code"
              placeholder="KLG-AU-9F3C2B"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
            <Button variant="dark" size="lg" className="w-full" disabled={busy}>
              {busy ? "Checking…" : "Verify certificate"}
            </Button>
          </form>
          {result && (
            <div className="mt-4 bg-white rounded-2xl border border-green-200 p-6 text-center">
              {result.revoked ? (
                <>
                  <XCircle size={28} className="text-red-600 mx-auto mb-2" />
                  <div className="text-sm font-extrabold text-red-700">This certificate was revoked.</div>
                  <p className="text-xs text-gray mt-1">Code {result.code} is no longer valid. Contact us to appeal.</p>
                </>
              ) : (
                <>
                  <ShieldCheck size={28} className="text-green-700 mx-auto mb-2" />
                  <div className="text-sm font-extrabold text-green-800">Valid certificate ✓</div>
                  <div className="text-base font-extrabold text-navy mt-2">{result.recipient_name}</div>
                  <div className="text-xs text-gray mt-0.5">{result.course_title}</div>
                  <div className="text-[11px] text-gray mt-1">
                    Issued {new Date(result.issued_at).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })} · {result.code}
                  </div>
                </>
              )}
            </div>
          )}
          {result && !result.revoked && profile?.id === result.member_id && (
            <div className="mt-4 no-print">
              <CertificatePrint
                recipient={result.recipient_name}
                course={result.course_title}
                issuedAt={result.issued_at}
                code={result.code}
              />
              <button
                type="button"
                onClick={() => {
                  recordLeadEvent({ source: "verify", action: "print" });
                  window.print();
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-blue transition-colors"
              >
                <Printer size={14} /> Print / Save certificate PDF
              </button>
              <p className="text-[11px] text-gray text-center mt-2">
                Only you see this — employers checking your code see the verification above.
              </p>
            </div>
          )}
          {missed && (
            <div className="mt-4 bg-white rounded-2xl border border-border p-6 text-center">
              <div className="text-sm font-extrabold text-navy mb-1">No certificate found for that code.</div>
              <p className="text-xs text-gray">Check the spelling — codes look like KLG-AU-9F3C2B. Still stuck? WhatsApp 0268 708 895.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
