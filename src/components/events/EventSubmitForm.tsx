"use client";

import { useState, type FormEvent } from "react";
import { Calendar, Clock, MapPin, Users, Send } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { EVENT_TYPE_LABELS, submitEvent } from "@/lib/events";
import type { EventType } from "@/lib/database.types";

const input =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-amber transition-colors font-sans placeholder:text-gray/60";

export function EventSubmitForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("workshop");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [spots, setSpots] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!profile) return null;
  const memberId = profile.id;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give the event a title.");
    if (!date) return setError("Pick a date.");
    if (!time) return setError("Pick a start time.");

    setSubmitting(true);
    const res = await submitEvent(
      {
        title: title.trim(),
        type,
        date,
        time,
        location: location.trim() || null,
        spots: spots ? Math.max(1, parseInt(spots, 10)) : 0,
        description: description.trim() || null,
      },
      memberId,
    );
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Could not submit. Try again.");
      return;
    }
    setDone(true);
    onSubmitted?.();
  }

  if (done) {
    return (
      <div className="bg-green/10 border border-green/30 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-3">
          ✓
        </div>
        <h3 className="text-base font-extrabold text-navy mb-1">Event submitted for review!</h3>
        <p className="text-sm text-gray leading-relaxed">
          An admin will review <span className="font-bold text-navy">&quot;{title.trim()}&quot;</span> and we&apos;ll
          notify you here as soon as it&apos;s approved. Track it in your dashboard.
        </p>
        <a
          href="/dashboard/events"
          className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:bg-blue transition-colors font-sans"
        >
          Track my event →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      {error && (
        <div className="rounded-lg bg-red/10 border border-red/30 text-red-700 px-3.5 py-2.5 text-xs font-semibold">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-bold text-navy mb-1.5">Event title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekend Coding Workshop for Youth"
          className={input}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-navy mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            className={`${input} cursor-pointer`}
          >
            {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-navy mb-1.5">Spots (0 = open)</label>
          <input
            value={spots}
            onChange={(e) => setSpots(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 30"
            inputMode="numeric"
            className={input}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-navy mb-1.5 inline-flex items-center gap-1">
            <Calendar size="12" /> Date
          </label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-navy mb-1.5 inline-flex items-center gap-1">
            <Clock size="12" /> Start time
          </label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-navy mb-1.5 inline-flex items-center gap-1">
          <MapPin size="12" /> Location
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Klagon Community Centre, near the junction"
          className={input}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-navy mb-1.5 inline-flex items-center gap-1">
          <Users size="12" /> Short description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Who it is for, what happens, what to bring…"
          className={`${input} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber text-navy text-sm font-extrabold hover:bg-amber-strong hover:text-white transition-colors cursor-pointer disabled:opacity-60 font-sans"
      >
        <Send size="15" />
        {submitting ? "Submitting…" : "Submit for approval"}
      </button>
      <p className="text-[11px] text-gray">
        Your event goes to a review queue — an admin approves it before it appears on the public events page.
        You&apos;ll get a notification either way.
      </p>
    </form>
  );
}