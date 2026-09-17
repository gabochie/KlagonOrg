"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { Turnstile } from "@/components/Turnstile";
import { useAuth } from "@/components/auth/AuthProvider";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  AREA_LABELS,
  CATEGORY_SEEDS,
  POST_TYPE_LABELS,
  PROPERTY_SUBCATEGORIES,
  AUTO_SUBCATEGORIES,
  submitPost,
} from "@/lib/posts";
import type { PostArea, PostInput, PostType } from "@/types";

const TYPES: PostType[] = ["news", "event", "business", "classified", "job", "announcement"];
const AREAS: PostArea[] = ["klagon", "tema_west", "other"];

const NEEDS_PRICE: PostType[] = ["classified", "job"];
const NEEDS_EVENT_FIELDS: PostType[] = ["event"];
const NEEDS_CONTACT: PostType[] = ["classified", "business", "job"];

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const [type, setType] = useState<PostType>("news");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [area, setArea] = useState<PostArea>("klagon");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const categories = CATEGORY_SEEDS[type];
  const showSubcategory = type === "classified" && (category === "Properties" || category === "Auto");
  const subcategories = category === "Properties" ? [...PROPERTY_SUBCATEGORIES] : [...AUTO_SUBCATEGORIES];

  function pickType(t: PostType) {
    setType(t);
    setCategory("");
    setSubcategory("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("Sign in to submit. Posting is free for members.");
      return;
    }
    if (!token) {
      setError("Please complete the human check before submitting.");
      return;
    }
    if (title.trim().length < 5) {
      setError("Give your post a title of at least 5 characters.");
      return;
    }
    setSending(true);
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setSending(false);
      setError(check.error ?? "Human check failed. Please try again.");
      return;
    }
    const input: PostInput = {
      type,
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      body: body.trim() || undefined,
      category: category || undefined,
      subcategory: showSubcategory && subcategory ? subcategory : null,
      area,
      price_ghs: NEEDS_PRICE.includes(type) && price.trim() !== "" ? Number(price) : null,
      contact_phone: NEEDS_CONTACT.includes(type) ? phone.trim() || null : null,
      contact_email: NEEDS_CONTACT.includes(type) ? email.trim() || null : null,
      event_date: NEEDS_EVENT_FIELDS.includes(type) ? eventDate || null : null,
      event_time: NEEDS_EVENT_FIELDS.includes(type) ? eventTime.trim() || null : null,
      event_location: NEEDS_EVENT_FIELDS.includes(type) ? eventLocation.trim() || null : null,
    };
    const res = await submitPost(input, user.id);
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "Submission failed. Please try again.");
      return;
    }
    setDoneId(res.id ?? "ok");
  }

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon + Tema West
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Share with the community
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              News, events, business listings, classifieds, jobs, announcements — free to post.
              Every submission is reviewed before going live.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="text-center text-sm text-gray py-10">Checking sign-in…</div>
            ) : !user ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-sm font-bold text-navy mb-2">Members post free</div>
                <p className="text-sm text-gray mb-4">
                  Sign in to submit. No account yet? Joining is free with instant access.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/auth/login">
                    <Button variant="primary">Log In →</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="dark">Join Free →</Button>
                  </Link>
                </div>
              </div>
            ) : doneId ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-sm font-bold text-navy mb-2">Submitted for review</div>
                <p className="text-sm text-gray mb-4">
                  An admin will approve or reply with notes. Track it under My Posts.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/my/posts">
                    <Button variant="primary">My Posts →</Button>
                  </Link>
                  <button
                    onClick={() => {
                      setDoneId(null);
                      setTitle("");
                      setExcerpt("");
                      setBody("");
                      setToken(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-light text-navy text-sm font-bold cursor-pointer hover:bg-pale"
                  >
                    Post Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div>
                  <div className="text-xs font-bold text-navy mb-2">What are you posting?</div>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => pickType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                          type === t
                            ? "bg-navy text-white border-navy"
                            : "bg-white text-gray border-border hover:border-navy"
                        }`}
                      >
                        {POST_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-navy">
                    Category
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setSubcategory("");
                      }}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                    >
                      <option value="">Select…</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-navy">
                    Area
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value as PostArea)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                    >
                      {AREAS.map((a) => (
                        <option key={a} value={a}>
                          {AREA_LABELS[a]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {showSubcategory && (
                  <label className="text-xs font-bold text-navy">
                    {category} type
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                    >
                      <option value="">Select…</option>
                      {subcategories.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <Input
                  label="Title"
                  placeholder="What should the community know?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  label="Short summary"
                  placeholder="One or two sentences for the feed card"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
                <label className="text-xs font-bold text-navy">
                  Full details
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="Tell the full story: what, where, when, how to reach you…"
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                  />
                </label>

                {NEEDS_PRICE.includes(type) && (
                  <Input
                    label="Price (GH₵, optional)"
                    type="number"
                    placeholder="e.g. 500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                )}

                {NEEDS_EVENT_FIELDS.includes(type) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <Input
                      label="Time"
                      placeholder="10:00 AM"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                    <Input
                      label="Venue"
                      placeholder="Community Hall, Klagon"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                    />
                  </div>
                )}

                {NEEDS_CONTACT.includes(type) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Contact phone"
                      placeholder="0244 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <Input
                      label="Contact email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}

                <Turnstile onToken={setToken} />

                {error && (
                  <div className="text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <Button variant="primary" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Submitting…" : "Submit for Review →"}
                </Button>
                <p className="text-[11px] text-gray text-center">
                  Free to post. Reviews typically within a day. Paid boosts come after approval.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
