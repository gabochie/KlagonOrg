"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { Turnstile } from "@/components/Turnstile";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { verifyTurnstile } from "@/lib/turnstile";
import { submitPost } from "@/lib/posts";
import { uploadPostMedia, validateImage } from "@/lib/storage";
import { FIELD_STEPS, validateFieldCapture, type FieldCapture } from "@/lib/fieldKit";

const KINDS: FieldCapture["kind"][] = ["shop", "food", "stay", "service", "other"];

function FieldInner() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    kind: "shop" as FieldCapture["kind"],
    priceText: "",
    phone: "",
    hours: "",
    address: "",
    notes: "",
    consentGiven: false,
    consentDate: new Date().toISOString().slice(0, 10),
  });
  const [cover, setCover] = useState<File | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("Log in to submit field captures.");
      return;
    }
    if (!token) {
      setError("Complete the human check first.");
      return;
    }
    const check = validateFieldCapture({ ...form, collectorId: user.id });
    if (!check.ok || !check.input) {
      setError(`Missing: ${check.reasons.join(", ")}. No YES, no publish.`);
      return;
    }
    setSending(true);
    const human = await verifyTurnstile(token);
    if (!human.success) {
      setSending(false);
      setError(human.error ?? "Human check failed.");
      return;
    }
    let coverUrl: string | null = null;
    if (cover) {
      if (validateImage(cover)) {
        setSending(false);
        setError("Cover photo must be JPG/PNG/WEBP/GIF under 5MB.");
        return;
      }
      const up = await uploadPostMedia(cover, user.id);
      if (!up.ok) {
        setSending(false);
        setError(up.error);
        return;
      }
      coverUrl = up.url;
    }
    const res = await submitPost({ ...check.input, cover_url: coverUrl }, user.id);
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "Submit failed.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <div className="text-sm font-extrabold text-navy mb-2">Captured — in review</div>
        <p className="text-sm text-gray mb-4">
          Tell the owner it goes live after a quick review, usually within a day.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              setDone(false);
              setForm({
                businessName: "",
                kind: "shop",
                priceText: "",
                phone: "",
                hours: "",
                address: "",
                notes: "",
                consentGiven: false,
                consentDate: new Date().toISOString().slice(0, 10),
              });
              setCover(null);
              setToken(null);
            }}
            className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer"
          >
            Next Shop →
          </button>
          <Link
            href="/my/posts"
            className="px-4 py-2 rounded-lg bg-light text-navy text-sm font-bold"
          >
            My Captures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 sm:px-6">
      <div className="text-xs font-bold tracking-widest uppercase text-amber mb-1">
        Field Kit · Staff
      </div>
      <h1 className="text-2xl font-extrabold text-navy mb-5">The 10-minute shop visit</h1>

      <div className="flex flex-col gap-2 mb-8">
        {FIELD_STEPS.map((s, i) => (
          <div key={s.title} className="flex gap-3 bg-white border border-border rounded-xl p-3">
            <div className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="text-xs font-bold text-navy">{s.title}</div>
              <div className="text-[11px] text-gray leading-snug">{s.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <div className="text-sm font-extrabold text-navy">Capture</div>
        <Input
          label="Business name"
          value={form.businessName}
          onChange={(e) => set("businessName", e.target.value)}
          placeholder="APOG Klagon"
        />
        <label className="text-xs font-bold text-navy">
          Kind
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as FieldCapture["kind"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Top prices"
          value={form.priceText}
          onChange={(e) => set("priceText", e.target.value)}
          placeholder="Oil change GH₵150, …"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="WhatsApp / phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="0244 000 000"
          />
          <Input
            label="Hours"
            value={form.hours}
            onChange={(e) => set("hours", e.target.value)}
            placeholder="8am–6pm"
          />
        </div>
        <Input
          label="Address / landmark"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Sakumono Street, Klagon"
        />
        <Input
          label="Notes (optional)"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Best seller, owner name…"
        />
        <label className="text-xs font-bold text-navy">
          Shopfront photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-xs font-normal"
          />
        </label>
        <label className="flex items-start gap-2 bg-pale rounded-lg p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consentGiven}
            onChange={(e) => set("consentGiven", e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-navy">
            <span className="font-bold">Owner said YES</span> to publishing on klagon.org on{" "}
            <input
              type="date"
              value={form.consentDate}
              onChange={(e) => set("consentDate", e.target.value)}
              className="rounded border border-border px-1 py-0.5 text-xs"
            />
          </span>
        </label>
        <Turnstile onToken={setToken} />
        {error && <div className="text-xs font-semibold text-red-700">{error}</div>}
        <Button variant="primary" size="lg" className="w-full" disabled={sending}>
          {sending ? "Submitting…" : "Submit Capture →"}
        </Button>
      </form>
    </div>
  );
}

export default function FieldPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <RequireAuth>
        <FieldInner />
      </RequireAuth>
      <Footer />
    </div>
  );
}
