"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AREA_LABELS,
  submitPost,
  updateMyPost,
  resubmitPost,
  fetchPostById,
  type Vertical,
} from "@/lib/posts";
import { uploadPostMedia, validateImage } from "@/lib/storage";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import type { PostArea, PostInput, PostStatus, PostType } from "@/types";
import {
  POST_TYPES,
  TYPE_BLURBS,
  CLASSIFIED_VERTICALS,
  categoriesFor,
  subcategoriesFor,
  detailsFieldsFor,
  requiresBody,
  showContactFields,
  showEventFields,
  showPriceField,
  priceLabelFor,
  typeLabel,
  type FieldSpec,
} from "./fields";
import { ArrowLeft, ArrowRight, UploadCloud } from "lucide-react";

const POST_AREA_KEYS: PostArea[] = ["klagon", "tema_west", "other"];

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border text-sm font-sans bg-white focus:outline-2 focus:outline-amber focus:border-transparent";
const labelCls = "text-xs font-semibold text-navy";

export function PostForm({ editId }: { editId?: string | null }) {
  const { user, profile } = useAuth();

  const [step, setStep] = useState<"type" | "edit" | "preview">("type");
  const [loaded, setLoaded] = useState(!!editId);
  const [loadedStatus, setLoadedStatus] = useState<PostStatus | null>(null);

  const [type, setType] = useState<PostType>("news");
  const [vertical, setVertical] = useState<Vertical>("Properties");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [area, setArea] = useState<PostArea>("klagon");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    void (async () => {
      const p = await fetchPostById(editId);
      if (!active || !p) return;
      setType(p.type);
      if (p.type === "classified") setVertical((p.category as Vertical) || "Properties");
      setTitle(p.title);
      setExcerpt(p.excerpt ?? "");
      setBody(p.body ?? "");
      setArea(p.area);
      setCategory(p.category);
      setSubcategory(p.subcategory ?? "");
      setDetails((p.details as Record<string, string>) ?? {});
      setPrice(p.priceGhs != null ? String(p.priceGhs) : "");
      setPhone(p.contactPhone ?? profile?.phone ?? "");
      setEmail(p.contactEmail ?? user?.email ?? "");
      setEventDate(p.eventDate ?? "");
      setEventTime(p.eventTime ?? "");
      setEventLocation(p.eventLocation ?? "");
      setExistingCover(p.coverUrl);
      setLoadedStatus(p.status);
      setStep("edit");
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const actualCategory = type === "classified" ? vertical : category;

  const handleCover = (f: File | null) => {
    setCover(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(f ? URL.createObjectURL(f) : null);
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Please add a title.";
    if (!actualCategory) return "Please choose a category.";
    if (requiresBody(type) && !body.trim()) return "Please write the main content.";
    if (type === "classified") {
      if (!phone.trim() && vertical !== "Jobs") return "Add a contact phone so buyers can reach you.";
      if (vertical === "Properties" && !details.listing_type)
        return "Choose a listing type (rent / sale / short-stay).";
    }
    if (type === "event" && !eventDate) return "Add the event date.";
    if (cover && validateImage(cover)) return validateImage(cover);
    return null;
  };

  const publish = async () => {
    setError(null);
    const v = validate();
    if (v) return setError(v);
    if (!token) return setError("Please complete the human check before submitting.");
    const check = await verifyTurnstile(token);
    if (!check.success) return setError(check.error ?? "Human check failed. Please try again.");
    setBusy(true);
    try {
      let coverUrl: string | null = existingCover;
      if (cover) {
        const up = await uploadPostMedia(cover, user?.id ?? "");
        if (!up.ok) return setError(up.error);
        coverUrl = up.url;
      }
      const input: PostInput = {
        type,
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        body: body.trim() || undefined,
        category: actualCategory,
        subcategory: subcategory.trim() || null,
        details,
        area,
        cover_url: coverUrl,
        gallery: undefined,
        price_ghs: price ? Number(price) : null,
        contact_phone: phone.trim() || profile?.phone || null,
        contact_email: email.trim() || user?.email || null,
        event_date: eventDate || null,
        event_time: eventTime || null,
        event_location: eventLocation || null,
      };
      if (editId) {
        const after = await updateMyPost(editId, input);
        if (!after.ok) return setError(after.error ?? "Something went wrong.");
        if (loadedStatus === "rejected") {
          const rs = await resubmitPost(editId);
          if (!rs.ok) return setError(rs.error ?? "Something went wrong.");
        }
        setSuccessId(editId);
      } else {
        const res = await submitPost(input, user?.id ?? "");
        if (!res.ok) return setError(res.error ?? "Something went wrong.");
        setSuccessId(res.id ?? null);
      }
    } finally {
      setBusy(false);
    }
  };

  if (successId) {
    return (
      <div className="bg-white rounded-2xl border border-border p-10 max-w-lg mx-auto text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-600 text-xl">✓</span>
        </div>
        <h2 className="text-lg font-extrabold text-navy mb-1">
          {editId ? "Your post was updated" : "Post submitted for review"}
        </h2>
        <p className="text-sm text-gray mb-6">
          {editId
            ? "Changes are saved. If it was rejected, it has been resubmitted to the moderation queue."
            : "An admin will review it shortly. You'll get a notification once it goes live or needs changes."}
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            href="/my/posts"
            className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
          >
            My posts
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-navy hover:bg-light transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const categories = categoriesFor(type);
  const subcategories = subcategoriesFor(type, vertical);
  const detailFields: FieldSpec[] = detailsFieldsFor(type, vertical);

  const renderField = (spec: FieldSpec) => (
    <div key={spec.key} className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {spec.label}
        {spec.required && <span className="text-red"> *</span>}
      </label>
      {spec.kind === "select" ? (
        <select
          value={details[spec.key] ?? ""}
          onChange={(e) => setDetails((d) => ({ ...d, [spec.key]: e.target.value }))}
          className={inputCls}
        >
          <option value="">Select…</option>
          {spec.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : spec.kind === "textarea" ? (
        <textarea
          rows={2}
          value={details[spec.key] ?? ""}
          placeholder={spec.placeholder}
          onChange={(e) => setDetails((d) => ({ ...d, [spec.key]: e.target.value }))}
          className={inputCls}
        />
      ) : (
        <input
          type={spec.kind === "number" ? "number" : spec.kind === "date" ? "date" : "text"}
          value={details[spec.key] ?? ""}
          placeholder={spec.placeholder}
          onChange={(e) => setDetails((d) => ({ ...d, [spec.key]: e.target.value }))}
          className={inputCls}
        />
      )}
    </div>
  );

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-gray font-semibold">Loading your post…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {step === "type" && (
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-navy mb-1">What are you posting?</h2>
          <p className="text-sm text-gray mb-6">
            Everything goes to a review queue first. Posting is free — boosts to spotlight it come later.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {POST_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory("");
                  setStep("edit");
                }}
                className="text-left p-4 rounded-xl border border-border hover:border-navy hover:bg-pale transition-colors cursor-pointer"
              >
                <div className="text-sm font-extrabold text-navy">{typeLabel(t)}</div>
                <div className="text-xs text-gray mt-0.5">{TYPE_BLURBS[t]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "edit" && (
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <button
            type="button"
            onClick={() => !editId && setStep("type")}
            className={`flex items-center gap-1 text-xs font-bold mb-4 ${editId ? "invisible" : "text-blue hover:underline cursor-pointer"}`}
          >
            <ArrowLeft size="13" /> Back
          </button>

          {loadedStatus === "rejected" && (
            <div className="mb-5 rounded-xl border border-red/30 bg-red-50 p-3 text-xs text-red-700 font-semibold">
              This post was not approved. Edit it below and resubmit — it will go back to the review
              queue.
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-bold text-gray uppercase tracking-wider mb-2">
                Type · {typeLabel(type)}
              </div>
              {type === "classified" && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {CLASSIFIED_VERTICALS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setVertical(v);
                        setSubcategory("");
                        setDetails({});
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                        vertical === v
                          ? "bg-navy text-white"
                          : "bg-light text-gray border border-border hover:border-navy"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {!editId && (
                <button
                  type="button"
                  onClick={() => setType("news")}
                  className="text-[11px] text-blue font-semibold hover:underline cursor-pointer"
                >
                  Change type
                </button>
              )}
            </div>

            {categories.length > 0 && !(type === "classified") && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Category <span className="text-red">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        category === c
                          ? "bg-navy text-white"
                          : "bg-light text-gray border border-border hover:border-navy"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>
                Title <span className="text-red">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A short, clear headline"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Short summary</label>
              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="One line that explains it"
                className={inputCls}
              />
            </div>

            {requiresBody(type) && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>
                  Details <span className="text-red">*</span>
                </label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the full content here"
                  className={inputCls}
                />
              </div>
            )}

            {subcategories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Subcategory</label>
                <div className="flex flex-wrap gap-1.5">
                  {subcategories.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubcategory(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        subcategory === s
                          ? "bg-navy text-white"
                          : "bg-light text-gray border border-border hover:border-navy"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {detailFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-pale/60 p-4 border border-border">
                {detailFields.map(renderField)}
              </div>
            )}

            {showPriceField(type, vertical) && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{priceLabelFor(type, vertical)}</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            )}

            {showEventFields(type) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    Date <span className="text-red">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className={labelCls}>Location</label>
                  <input
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Klagon Community Centre"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {showContactFields(type) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-pale/60 p-4 border border-border">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    Contact phone{type === "classified" && <span className="text-red"> *</span>}
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0244 000 000"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Contact email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Area</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as PostArea)}
                className={inputCls}
              >
                {POST_AREA_KEYS.map((a) => (
                  <option key={a} value={a}>
                    {AREA_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Cover image</label>
              {existingCover && !cover && (
                <div className="rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={existingCover} alt="" className="w-full h-40 object-cover" />
                </div>
              )}
              {coverPreview && (
                <div className="rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="" className="w-full h-40 object-cover" />
                </div>
              )}
              <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-gray hover:border-navy hover:text-navy cursor-pointer transition-colors">
                <UploadCloud size="16" />
                {cover || existingCover ? "Change image" : "Upload an image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleCover(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-[11px] text-gray/70">JPG, PNG, WEBP or GIF · max 5 MB</p>
            </div>

            {error && <p className="text-xs text-red font-semibold">{error}</p>}

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const v = validate();
                if (v) return setError(v);
                setError(null);
                setStep("preview");
              }}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors disabled:opacity-60"
            >
              Review submission <ArrowRight size="15" />
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <button
            type="button"
            onClick={() => setStep("edit")}
            className="flex items-center gap-1 text-xs font-bold text-blue hover:underline mb-4 cursor-pointer"
          >
            <ArrowLeft size="13" /> Back to edit
          </button>
          <div className="text-xs font-bold text-gray uppercase tracking-wider mb-3">
            Review your {typeLabel(type)}
            {type === "classified" ? ` · ${vertical}` : category ? ` · ${category}` : ""}
          </div>
          <div className="rounded-xl border border-border overflow-hidden mb-4">
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="" className="w-full h-44 object-cover" />
            ) : existingCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={existingCover} alt="" className="w-full h-44 object-cover" />
            ) : (
              <div className="h-16 bg-pale flex items-center justify-center">
                <div className="text-xl">🖼️</div>
              </div>
            )}
            <div className="p-4">
              <div className="text-sm font-extrabold text-navy">{title}</div>
              {excerpt && <div className="text-sm text-gray mt-1">{excerpt}</div>}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray">
                <span className="px-1.5 py-0.5 rounded-full bg-light border border-border font-semibold">
                  {AREA_LABELS[area]}
                </span>
                {price && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 font-bold">
                    GH₵ {price}
                  </span>
                )}
              </div>
              {Object.keys(details).length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                  {Object.entries(details).map(([k, v]) =>
                    v ? (
                      <div key={k} className="text-[11px]">
                        <span className="text-gray/60 capitalize">{k.replace(/_/g, " ")}: </span>
                        <span className="text-navy font-semibold capitalize">{v}</span>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>

          <Turnstile onToken={setToken} />
          {error && <p className="text-xs text-red font-semibold mt-2">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors disabled:opacity-60"
          >
            {busy ? "Submitting…" : editId ? "Save changes" : "Submit for review"}
          </button>
        </div>
      )}
    </div>
  );
}