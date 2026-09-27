import { describe, expect, it } from "vitest";
import {
  RADIO_SHOWS,
  accraMinutes,
  currentShow,
  nextShow,
  onAirWindowLabel,
} from "./radioSchedule";

/** Accra is GMT with no DST, so a UTC instant maps 1:1 to Accra wall time. */
const at = (hhmm: string) => new Date(`2026-01-01T${hhmm}:00.000Z`);

describe("radioSchedule", () => {
  it("publishes a contiguous, non-overlapping daily schedule", () => {
    expect(RADIO_SHOWS.length).toBeGreaterThan(0);
    for (let i = 0; i < RADIO_SHOWS.length; i++) {
      const show = RADIO_SHOWS[i];
      expect(show.end).toBeGreaterThan(show.start);
      if (i > 0) {
        // Each show must start exactly where the previous one ends.
        expect(show.start).toBe(RADIO_SHOWS[i - 1].end);
      }
    }
    expect(RADIO_SHOWS[0].start).toBe(6 * 60);
  });

  it("derives the advertised on-air window from the schedule itself", () => {
    // The badge used to read 06:00-22:00 while the last show ran to 23:00.
    expect(onAirWindowLabel()).toBe("06:00–23:00");
  });

  it("normalises midnight to 00:xx rather than 24:xx", () => {
    expect(accraMinutes(at("00:00"))).toBe(0);
    expect(accraMinutes(at("23:59"))).toBe(23 * 60 + 59);
  });

  it("resolves the show that is scheduled to be on air", () => {
    expect(currentShow(at("07:00"))?.id).toBe("morning");
    expect(currentShow(at("12:00"))?.id).toBe("afternoon");
    expect(currentShow(at("15:00"))?.id).toBe("sports");
    expect(currentShow(at("16:30"))?.id).toBe("sports");
    expect(currentShow(at("19:00"))?.id).toBe("evening");
    expect(currentShow(at("22:30"))?.id).toBe("night");
  });

  it("reports off-air outside the schedule, including the overnight gap", () => {
    expect(currentShow(at("05:00"))).toBeNull();
    expect(currentShow(at("23:30"))).toBeNull();
    // Show end is exclusive, so 23:00 is already off air.
    expect(currentShow(at("23:00"))).toBeNull();
  });

  it("always points a listener at the next show, wrapping to tomorrow", () => {
    expect(nextShow(at("05:00"))?.id).toBe("morning");
    expect(nextShow(at("11:00"))?.id).toBe("afternoon");
    // Mid-show it still names what is coming up later today.
    expect(nextShow(at("19:00"))?.id).toBe("night");
    // After the last show it rolls over to tomorrow's first.
    expect(nextShow(at("23:30"))?.id).toBe("morning");
  });
});
