"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { parseContact } from "@/lib/sponsors";
import { uploadSponsorMedia, validateImage } from "@/lib/storage";
import type { Database } from "@/lib/database.types";

type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

function parseAddress(l: SponsorRow["location"]): string {
  const loc = (l ?? {}) as { address?: string };
  return loc.address ?? "";
}

function ManageInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const { user } = useAuth();
  const [sponsor, setSponsor] = useState<SponsorRow | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    tagline: "",
    about: "",
    price_range: "",
    opening_hours: "",
    amenities: "",
    phone: "",
    whatsapp: "",
    address: "",
    check_in: "",
    check_out: "",
    booking_note: "",
  });
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }
      const c = isSupabaseConfigured() ? getBrowserClient() : null;
      if (!c) {
        setLoading(false);
        return;
      }
      const { data } = await c.from("sponsors").select("*").eq("id", id).maybeSingle();
      const row = (data ?? null) as SponsorRow | null;
      if (row && row.claimed_by === user.id) {
        setSponsor(row);
        const contact = parseContact(row.contact);
        setForm({
          tagline: row.tagline ?? "",
          about: row.about ?? "",
          price_range: row.price_range ?? "",
          opening_hours: row.opening_hours ?? "",
          amenities: (row.amenities ?? []).join(", "),
          phone: contact.phone ?? "",
          whatsapp: contact.whatsapp ?? "",
          address: (parseAddress(row.location) ?? ""),
          check_in: row.check_in ?? "",
          check_out: row.check_out ?? "",
          booking_note: row.booking_note ?? "",
        });
        const { data: revs } = await c
          .from("reviews")
          .select("*")
          .eq("sponsor_id", id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(20);
        setReviews((revs ?? []) as ReviewRow[]);
      }
      setLoading(false);
    })();
  }, [id, user]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!user || !sponsor) return;
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setNotice("Supabase is not configured.");
      return;
    }
    setSaving(true);
    setNotice(null);
    const { error } = await c
      .from("sponsors")
      .update({
        tagline: form.tagline.trim() || null,
        about: form.about.trim() || null,
        price_range: form.price_range.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        contact: {
          ...(parseContact(sponsor.contact) as Record<string, unknown>),
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
        },
        location: {
          ...((sponsor.location ?? {}) as Record<string, unknown>),
          address: form.address.trim() || null,
        },
        check_in: form.check_in.trim() || null,
        check_out: form.check_out.trim() || null,
        booking_note: form.booking_note.trim() || null,
      })
      .eq("id", sponsor.id);
    setSaving(false);
    setNotice(error ? error.message : "Saved. Changes are live on your profile.");
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || !user || !sponsor) return;
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setNotice("Supabase is not configured.");
      return;
    }
    const valid = [...files].filter((f) => !validateImage(f));
    if (valid.length === 0) {
      setNotice("No valid images (JPG/PNG/WEBP/GIF under 5MB).");
      return;
    }
    setUploading(true);
    setNotice(null);
    const urls: string[] = [];
    for (const f of valid.slice(0, 6)) {
      const res = await uploadSponsorMedia(f, sponsor.id);
      if (res.ok) urls.push(res.url);
      else setNotice(res.error);
    }
    if (urls.length > 0) {
      const { error } = await c
        .from("sponsors")
        .update({ photos: [...(sponsor.photos ?? []), ...urls].slice(0, 12) })
        .eq("id", sponsor.id);
      if (!error) setSponsor({ ...sponsor, photos: [...(sponsor.photos ?? []), ...urls] });
      else setNotice(error.message);
    }
    setUploading(false);
    if (urls.length > 0 && !notice) setNotice(`${urls.length} photo(s) added.`);
  }

  async function reply(reviewId: string) {
    const text = (replies[reviewId] ?? "").trim();
    if (!text) return;
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) return;
    const { error } = await c.from("reviews").update({ reply: text }).eq("id", reviewId);
    if (error) setNotice(error.message);
    else {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply: text } : r)));
      setReplies((prev) => ({ ...prev, [reviewId]: "" }));
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-gray">Loading…</div>;
  if (!user) {
    return (
      <div className="py-20 px-4 text-center">
        <div className="text-sm font-bold text-navy mb-2">Log in to manage your listing</div>
        <Link href="/auth/login">
          <Button variant="primary">Log In →</Button>
        </Link>
      </div>
    );
  }
  if (!sponsor) {
    return (
      <div className="py-20 px-4 text-center">
        <div className="text-sm font-bold text-navy mb-2">No listing here</div>
        <p className="text-sm text-gray mb-4">
          Either the id is wrong or the claim isn&apos;t approved yet.
        </p>
        <Link href="/my/posts">
          <Button variant="dark">My Posts →</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 flex flex-col gap-5">
      <div>
        <div className="text-xs font-bold tracking-widest uppercase text-amber mb-1">
          Managing
        </div>
        <h1 className="text-2xl font-extrabold text-navy">{sponsor.name}</h1>
      </div>

      {notice && (
        <div className="text-xs font-semibold text-navy bg-pale rounded-lg px-3 py-2">{notice}</div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-border rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-navy">{reviews.length}</div>
          <div className="text-[10px] text-gray font-bold">Reviews</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-navy">
            {reviews.length === 0
              ? "—"
              : (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
          </div>
          <div className="text-[10px] text-gray font-bold">Avg rating</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-navy">
            {reviews.filter((r) => !r.reply).length}
          </div>
          <div className="text-[10px] text-gray font-bold">Need reply</div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="text-sm font-extrabold text-navy mb-3">Photos ({sponsor.photos.length}/12)</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {sponsor.photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="w-full h-20 object-cover rounded-lg" loading="lazy" />
          ))}
        </div>
        <label className="block text-xs font-bold text-navy">
          Add photos (JPG/PNG/WEBP/GIF, 5MB max)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            onChange={(e) => void uploadPhotos(e.target.files)}
            className="mt-1 block w-full text-xs font-normal"
          />
        </label>
        {uploading && <div className="text-xs text-gray mt-1">Uploading…</div>}
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <div className="text-sm font-extrabold text-navy">Listing details</div>
        <Input label="Tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        <label className="text-xs font-bold text-navy">
          About
          <textarea
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Price range" value={form.price_range} onChange={(e) => set("price_range", e.target.value)} placeholder="GH₵ 150 – 300 / night" />
          <Input label="Opening hours" value={form.opening_hours} onChange={(e) => set("opening_hours", e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          <Input label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          <Input label="Amenities (comma separated)" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="WiFi, Parking, Breakfast" />
          <Input label="Check-in" value={form.check_in} onChange={(e) => set("check_in", e.target.value)} placeholder="2:00 PM" />
          <Input label="Check-out" value={form.check_out} onChange={(e) => set("check_out", e.target.value)} placeholder="12:00 PM" />
        </div>
        <Input label="Booking note" value={form.booking_note} onChange={(e) => set("booking_note", e.target.value)} placeholder="Pay 50% MoMo to confirm…" />
        <Button variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save Changes →"}
        </Button>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="text-sm font-extrabold text-navy mb-3">Reviews ({reviews.length})</div>
        {reviews.length === 0 ? (
          <div className="text-xs text-gray">No approved reviews yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-pale pb-3 last:border-0">
                <div className="text-xs font-bold text-navy">
                  {r.reviewer_name} · {r.rating}/5
                </div>
                {r.body && <p className="text-xs text-gray mt-1">{r.body}</p>}
                {r.reply ? (
                  <div className="text-xs text-gray mt-1 ml-3 pl-2 border-l-2 border-amber">
                    <span className="font-bold text-navy">Your reply: </span>
                    {r.reply}
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={replies[r.id] ?? ""}
                      onChange={(e) => setReplies((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Write a public reply…"
                      className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs"
                    />
                    <button
                      onClick={() => void reply(r.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManageBusinessPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <RequireAuth>
        <Suspense fallback={<div className="py-20 text-center text-sm text-gray">Loading…</div>}>
          <ManageInner />
        </Suspense>
      </RequireAuth>
      <Footer />
    </div>
  );
}
