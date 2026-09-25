"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { uploadMemberMedia } from "@/lib/storage";
import {
  VOLUNTEER_ID_TYPES,
  VOLUNTEER_TERMS_VERSION,
  fetchMyVolunteerApplications,
  fileVolunteerApplication,
  type VolunteerApplication,
} from "@/lib/volunteers";

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-gray/50 focus:outline-none focus:border-navy";
const labelCls = "block text-xs font-bold text-navy mb-1.5";

export function VolunteerApplicationForm({
  role,
  postId,
}: {
  role: string;
  postId: string | null;
}) {
  const { profile } = useAuth();
  const [idType, setIdType] = useState<string>("ghana_card");
  const [idNumber, setIdNumber] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [existing, setExisting] = useState<VolunteerApplication | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    void fetchMyVolunteerApplications(profile.id).then((apps) => {
      const match = apps.find((a) =>
        postId ? a.post_id === postId : a.post_id === null && a.role === role,
      );
      if (match) setExisting(match);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!photo) {
      void Promise.resolve(null).then(setPhotoPreview);
      return;
    }
    const url = URL.createObjectURL(photo);
    void Promise.resolve(url).then(setPhotoPreview);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  if (!profile) {
    return (
      <div className="rounded-xl border border-blue/20 bg-blue/5 px-4 py-5 text-center">
        <div className="text-sm font-extrabold text-navy mb-1">Sign in to apply</div>
        <p className="text-xs text-gray mb-3">
          Volunteering requires an account so we can verify your ID and track your service.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/auth/register"
            className="inline-flex rounded-lg bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-blue transition-colors"
          >
            Create free account →
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex rounded-lg border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:border-navy transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    );
  }

  if (done || existing?.status === "pending") {
    const app = existing;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
        <div className="text-sm font-extrabold text-navy mb-1">
          {done ? "Application received 🙋" : "Application under review"}
        </div>
        <p className="text-xs text-gray leading-relaxed">
          {done
            ? "Thank you! Our team will verify your details and confirm within a few days. You will be notified here."
            : `You applied${app?.created_at ? ` on ${new Date(app.created_at).toLocaleDateString()}` : ""}. We will confirm once verification is done.`}{" "}
          <Link href="/dashboard/volunteer" className="font-bold text-blue hover:underline">
            Track it in your dashboard →
          </Link>
        </p>
      </div>
    );
  }

  if (existing && ["probationary", "active"].includes(existing.status)) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-5 text-center">
        <div className="text-sm font-extrabold text-green-800 mb-1">
          You are on the team 🎉 ({existing.status})
        </div>
        <p className="text-xs text-gray">
          <Link href="/team" className="font-bold text-blue hover:underline">
            See the team page →
          </Link>
        </p>
      </div>
    );
  }

  const valid =
    idNumber.trim().length >= 4 && photo !== null && accepted && !busy;

  const submit = async () => {
    if (!valid || !profile?.id) return;
    setBusy(true);
    setNotice(null);
    const up = await uploadMemberMedia(photo as File, profile.id);
    if (!up.ok) {
      setBusy(false);
      setNotice(`Photo upload failed: ${up.error}`);
      return;
    }
    const res = await fileVolunteerApplication(profile.id, {
      postId,
      role,
      idType,
      idNumber: idNumber.trim(),
      photoUrl: up.url,
    });
    setBusy(false);
    if (!res.ok) {
      setNotice(res.error);
      return;
    }
    setDone(true);
  };

  return (
    <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
      {notice && (
        <div className="mb-4 rounded-lg bg-amber/10 px-3.5 py-2.5 text-xs font-semibold text-navy">
          {notice}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="va-idtype">
            ID type
          </label>
          <select
            id="va-idtype"
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            className={inputCls}
          >
            {VOLUNTEER_ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="va-idnumber">
            ID number
          </label>
          <input
            id="va-idnumber"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="e.g. GHA-XXXXXXXXX-X"
            className={inputCls}
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-gray">
            Visible to administrators for verification only. Never published.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <label className={labelCls} htmlFor="va-photo">
          Your photo (clear, front-facing)
        </label>
        <div className="flex items-center gap-3">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Your upload preview"
              className="w-16 h-16 rounded-xl object-cover border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-light border border-dashed border-border flex items-center justify-center text-xl text-gray/50">
              📷
            </div>
          )}
          <input
            id="va-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="text-xs text-gray file:mr-2 file:rounded-lg file:border file:border-border file:bg-pale file:px-3 file:py-2 file:text-xs file:font-bold file:text-navy hover:file:border-navy file:cursor-pointer"
          />
        </div>
        <p className="mt-1 text-[11px] text-gray">
          Shown on the public Team page once approved. JPG/PNG/WEBP under 5MB.
        </p>
      </div>
      <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#1A2E8C]"
        />
        <span className="text-xs text-gray leading-relaxed">
          I accept the{" "}
          <Link
            href="/volunteer/terms"
            target="_blank"
            className="font-bold text-blue hover:underline"
          >
            Volunteer Terms & Conditions (v{VOLUNTEER_TERMS_VERSION})
          </Link>{" "}
          — including unpaid service, the 30-day probation, and performance-based continuation.
        </span>
      </label>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!valid}
        className="mt-5 w-full py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors disabled:opacity-50 font-sans"
      >
        {busy ? "Submitting…" : `Apply for “${role}”`}
      </button>
    </div>
  );
}
