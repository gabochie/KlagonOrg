/**
 * Klagon Radio schedule — the single source of truth.
 *
 * The hero badge, the "on air now / next up" strip and the sponsorship cards
 * all read from here, so the on-air hours can never drift out of sync with the
 * copy that advertises them. Times are Accra local (Africa/Accra = GMT, no DST).
 *
 * HONESTY: these are the hours we publish. The stream itself only carries audio
 * while the Broadcaster PC is actually on air, which is why the UI never claims
 * "live" without also saying what to do when it is silent.
 */

export interface RadioShow {
  id: string;
  /** Minutes past midnight, Accra time. */
  start: number;
  end: number;
  title: string;
  desc: string;
  cta: string;
  sponsorSlot: string;
}

export const RADIO_SHOWS: RadioShow[] = [
  {
    id: "morning",
    start: 6 * 60,
    end: 12 * 60,
    title: "Good Morning Klagon",
    desc: "Sunrise news, community announcements, school and trotro updates. The show every household wakes to.",
    cta: "Sponsor the sunrise",
    sponsorSlot: "06:00–12:00",
  },
  {
    id: "afternoon",
    start: 12 * 60,
    end: 15 * 60,
    title: "Good Afternoon Klagon",
    desc: "Market prices, traffic, clinic hours, lost-and-found. Traders and mothers keep it on.",
    cta: "Sponsor midday",
    sponsorSlot: "12:00–15:00",
  },
  {
    id: "sports",
    start: 15 * 60,
    end: 18 * 60,
    title: "Klagon Sports Hour",
    desc: "Local teams, high-school fixtures, weekend scores. The loudest hour in Klagon.",
    cta: "Sponsor sports",
    sponsorSlot: "15:00–18:00",
  },
  {
    id: "evening",
    start: 18 * 60,
    end: 22 * 60,
    title: "Good Evening Klagon",
    desc: "Community mix — independent Klagon voices, interviews, event listings, plus the weekly Ramsar & ecotourism strand (Sakumo lagoon, birds, walk). Prime time.",
    cta: "Sponsor prime time",
    sponsorSlot: "18:00–22:00",
  },
  {
    id: "night",
    start: 22 * 60,
    end: 23 * 60,
    title: "Good Night Klagon",
    desc: "Night replays + tomorrow's notices. Falls asleep with the community.",
    cta: "Sponsor nights",
    sponsorSlot: "22:00–23:00",
  },
];

/** e.g. "06:00–23:00" — derived, so it can never contradict RADIO_SHOWS. */
export function onAirWindowLabel(): string {
  const first = RADIO_SHOWS[0];
  const last = RADIO_SHOWS[RADIO_SHOWS.length - 1];
  return `${hhmm(first.start)}–${hhmm(last.end)}`;
}

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutes past midnight in Africa/Accra for the given instant. */
export function accraMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // en-GB can render midnight as "24"; normalise so 00:xx stays inside the day.
  const hour = get("hour") % 24;
  return hour * 60 + get("minute");
}

export function currentShow(date: Date = new Date()): RadioShow | null {
  const now = accraMinutes(date);
  return RADIO_SHOWS.find((s) => now >= s.start && now < s.end) ?? null;
}

/**
 * The next show to start. When today's schedule is exhausted (the overnight
 * 23:00-06:00 gap) this rolls over to tomorrow's first show, so a listener
 * arriving at 02:00 is still told when the station returns rather than just
 * "off air".
 */
export function nextShow(date: Date = new Date()): RadioShow {
  const now = accraMinutes(date);
  return RADIO_SHOWS.find((s) => now < s.start) ?? RADIO_SHOWS[0];
}

export function accraClock(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
