import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_CHANNELS,
  CONSENT_TEXT_VERSION,
  channelList,
  hasAnyMarketingConsent,
  hasContactConsent,
  hasMarketingConsent,
  recordConsent,
  recordConsentBatch,
  recordContactConsent,
  recordProfileConsent,
  subjectForChannel,
} from "./consent";

/**
 * The default-deny reading, pinned down.
 *
 * What would go wrong without these: `hasMarketingConsent` returning `true`
 * for an unknown person (a missing ledger row must mean "never asked", not
 * "permission"), or `recordContactConsent` writing a phone-keyed row when the
 * phone was left blank (a ledger that looks complete but cannot prove who
 * agreed). Both are the kind of change that passes review because the happy
 * path still reads correctly.
 *
 * The Supabase client is mocked at the module boundary, so this stays inside
 * the pure `src/lib` lane that vitest.config.ts documents — nothing from
 * @supabase/supabase-js is loaded.
 */

const h = vi.hoisted(() => ({
  /** Every insert attempted, successful or not, so a swallowed error is visible. */
  attempts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  rpcCalls: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  leadEvents: [] as Array<Record<string, unknown>>,
  clientAvailable: true,
  insertFails: null as ((row: Record<string, unknown>) => string | null) | null,
  rpcResult: null as
    | ((args: Record<string, unknown>) => { data: unknown; error: { message: string } | null })
    | null,
}));

vi.mock("@/lib/supabase-browser", () => ({
  getBrowserClient: () => {
    if (!h.clientAvailable) return null;
    return {
      from: (table: string) => ({
        insert: async (row: Record<string, unknown>) => {
          h.attempts.push({ table, row });
          const message = h.insertFails?.(row) ?? null;
          return { error: message ? { message } : null };
        },
      }),
      rpc: async (fn: string, args: Record<string, unknown>) => {
        h.rpcCalls.push({ fn, args });
        if (h.rpcResult) return h.rpcResult(args);
        return { data: null, error: null };
      },
    };
  },
  isSupabaseConfigured: () => h.clientAvailable,
}));

vi.mock("@/lib/analytics", () => ({
  recordLeadEvent: (event: Record<string, unknown>) => {
    h.leadEvents.push(event);
  },
}));

const rows = () => h.attempts.map((a) => a.row);

beforeEach(() => {
  h.attempts.length = 0;
  h.rpcCalls.length = 0;
  h.leadEvents.length = 0;
  h.clientAvailable = true;
  h.insertFails = null;
  h.rpcResult = null;
});

describe("wording helpers", () => {
  it("lists one, two and three channels the way the forms say them", () => {
    expect(channelList(["email"])).toBe("email");
    expect(channelList(["sms"])).toBe("SMS");
    expect(channelList(["whatsapp"])).toBe("WhatsApp");
    expect(channelList(["email", "sms"])).toBe("email or SMS");
    expect(channelList(["sms", "whatsapp"])).toBe("SMS or WhatsApp");
    expect(channelList(CONSENT_CHANNELS)).toBe("email, SMS or WhatsApp");
  });

  it("looks each channel up under the identifier a sender actually holds", () => {
    expect(subjectForChannel("email")).toBe("email");
    expect(subjectForChannel("sms")).toBe("phone");
    expect(subjectForChannel("whatsapp")).toBe("phone");
  });

  it("pins the wording version and the channel set the UI renders", () => {
    expect(CONSENT_TEXT_VERSION).toBe("2026-10");
    expect(CONSENT_CHANNELS).toEqual(["email", "sms", "whatsapp"]);
  });
});

describe("recordConsent", () => {
  const base = {
    subject_type: "email" as const,
    subject_value: "Ama@Example.com",
    channel: "email" as const,
    granted: true,
    form_source: "footer",
  };

  it("writes a normalised row stamped with the wording version", async () => {
    const { error } = await recordConsent({ ...base, subject_value: "  Ama@Example.COM  " });
    expect(error).toBeNull();
    expect(h.attempts).toHaveLength(1);
    expect(h.attempts[0].table).toBe("marketing_consents");
    expect(rows()[0]).toMatchObject({
      subject_value: "ama@example.com",
      granted: true,
      form_source: "footer",
      consent_text_version: CONSENT_TEXT_VERSION,
      context: null,
    });
  });

  it("refuses a blank subject instead of recording consent for nobody", async () => {
    for (const subject_value of ["", "   "]) {
      const { error } = await recordConsent({ ...base, subject_value });
      expect(error).toBe("Nothing to record consent for.");
    }
    expect(h.attempts).toHaveLength(0);
    expect(h.leadEvents).toHaveLength(0);
  });

  it("returns rather than throws when Supabase is not configured", async () => {
    h.clientAvailable = false;
    const { error } = await recordConsent(base);
    expect(error).toBe("Supabase is not configured.");
    expect(h.attempts).toHaveLength(0);
    expect(h.leadEvents).toHaveLength(0);
  });

  it("reports a ledger failure and does not claim an event was recorded", async () => {
    h.insertFails = () => "row-level security policy violation";
    const { error } = await recordConsent(base);
    expect(error).toBe("row-level security policy violation");
    expect(h.leadEvents).toHaveLength(0);
  });

  it("tells granted and declined apart in the lead event", async () => {
    await recordConsent(base);
    await recordConsent({ ...base, granted: false });
    expect(h.leadEvents).toHaveLength(2);
    expect(h.leadEvents[0]).toMatchObject({
      source: "footer",
      action: "consent-granted",
      metadata: { channel: "email" },
    });
    expect(h.leadEvents[1].action).toBe("consent-declined");
  });
});

describe("recordConsentBatch", () => {
  it("records every channel from the one tick", async () => {
    const { error } = await recordConsentBatch({
      subject_type: "email",
      subject_value: "ama@example.com",
      channels: CONSENT_CHANNELS,
      granted: true,
      form_source: "register",
    });
    expect(error).toBeNull();
    expect(rows().map((r) => r.channel)).toEqual(["email", "sms", "whatsapp"]);
    expect(new Set(rows().map((r) => r.form_source))).toEqual(new Set(["register"]));
  });

  it("keeps going after a failure but reports the first one", async () => {
    h.insertFails = (row) => (row.channel === "sms" ? "boom" : null);
    const { error } = await recordConsentBatch({
      subject_type: "phone",
      subject_value: "+233241234567",
      channels: CONSENT_CHANNELS,
      granted: false,
      form_source: "walk-booking",
    });
    expect(error).toBe("boom");
    expect(h.attempts).toHaveLength(3);
  });
});

describe("recordContactConsent", () => {
  const both = { email: "ama@example.com", phone: "+233241234567" };

  it("keys each channel to the identifier that channel is sent on", async () => {
    await recordContactConsent({
      ...both,
      channels: CONSENT_CHANNELS,
      granted: true,
      form_source: "contact-form",
    });
    expect(rows().map((r) => `${r.subject_type}:${r.channel}`)).toEqual([
      "email:email",
      "phone:sms",
      "phone:whatsapp",
    ]);
    expect(rows()[1].subject_value).toBe("+233241234567");
  });

  it("skips channels whose identifier is missing rather than guessing one", async () => {
    await recordContactConsent({
      email: "ama@example.com",
      phone: null,
      channels: CONSENT_CHANNELS,
      granted: true,
      form_source: "contact-form",
    });
    expect(rows().map((r) => r.channel)).toEqual(["email"]);
  });

  it("treats a whitespace-only phone as no phone at all", async () => {
    await recordContactConsent({
      email: null,
      phone: "   ",
      channels: ["sms", "whatsapp"],
      granted: true,
      form_source: "visit-walk",
    });
    expect(h.attempts).toHaveLength(0);
  });

  it("records refusals too, so no stays distinguishable from never asked", async () => {
    await recordContactConsent({
      ...both,
      channels: ["sms"],
      granted: false,
      form_source: "contact-form",
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ granted: false, subject_type: "phone" });
  });

  it("returns the first failure while still attempting every channel", async () => {
    h.insertFails = (row) => (row.channel === "sms" ? "boom" : null);
    const { error } = await recordContactConsent({
      ...both,
      channels: CONSENT_CHANNELS,
      granted: true,
      form_source: "footer",
    });
    expect(error).toBe("boom");
    expect(h.attempts).toHaveLength(3);
  });
});

describe("recordProfileConsent", () => {
  it("refuses to write without a profile to key to", async () => {
    const { error } = await recordProfileConsent({
      profile_id: "",
      channels: ["email"],
      granted: true,
      form_source: "settings-profile",
    });
    expect(error).toBe("No profile to record consent for.");
    expect(h.attempts).toHaveLength(0);
  });

  it("keys every channel to the profile id, not to an address", async () => {
    const { error } = await recordProfileConsent({
      profile_id: "11111111-1111-1111-1111-111111111111",
      channels: CONSENT_CHANNELS,
      granted: true,
      form_source: "settings-profile",
    });
    expect(error).toBeNull();
    expect(rows()).toHaveLength(3);
    expect(new Set(rows().map((r) => r.subject_type))).toEqual(new Set(["profile"]));
    expect(new Set(rows().map((r) => r.subject_value))).toEqual(
      new Set(["11111111-1111-1111-1111-111111111111"]),
    );
  });
});

describe("hasMarketingConsent", () => {
  it("denies a blank subject without asking the ledger", async () => {
    expect(await hasMarketingConsent("email", "   ", "email")).toBe(false);
    expect(h.rpcCalls).toHaveLength(0);
  });

  it("returns null when the ledger cannot be reached, never true", async () => {
    h.clientAvailable = false;
    expect(await hasMarketingConsent("email", "ama@example.com", "email")).toBeNull();

    h.clientAvailable = true;
    h.rpcResult = () => ({ data: null, error: { message: "timeout" } });
    expect(await hasMarketingConsent("email", "ama@example.com", "email")).toBeNull();
  });

  it("reads no row as no permission", async () => {
    h.rpcResult = () => ({ data: null, error: null });
    expect(await hasMarketingConsent("email", "ama@example.com", "email")).toBe(false);

    h.rpcResult = () => ({ data: false, error: null });
    expect(await hasMarketingConsent("email", "ama@example.com", "email")).toBe(false);
  });

  it("grants only on an explicit true", async () => {
    h.rpcResult = () => ({ data: true, error: null });
    expect(await hasMarketingConsent("phone", "+233241234567", "whatsapp")).toBe(true);
    expect(h.rpcCalls[0]).toEqual({
      fn: "marketing_consent",
      args: {
        p_subject_type: "phone",
        p_subject_value: "+233241234567",
        p_channel: "whatsapp",
      },
    });
  });

  it("normalises the subject so case and spaces cannot split a lookup", async () => {
    h.rpcResult = () => ({ data: true, error: null });
    await hasMarketingConsent("email", "  AMA@Example.COM ", "email");
    expect(h.rpcCalls[0].args.p_subject_value).toBe("ama@example.com");
  });
});

describe("hasAnyMarketingConsent", () => {
  it("stops at the first channel that says yes", async () => {
    h.rpcResult = (args) => ({ data: args.p_channel === "sms", error: null });
    expect(await hasAnyMarketingConsent("phone", "+233241234567", CONSENT_CHANNELS)).toBe(true);
    expect(h.rpcCalls).toHaveLength(2);
    expect(h.rpcCalls.map((c) => c.args.p_channel)).toEqual(["email", "sms"]);
  });

  it("is false when every channel refuses or is unknown", async () => {
    h.rpcResult = (args) => ({ data: args.p_channel === "whatsapp" ? false : null, error: null });
    expect(await hasAnyMarketingConsent("phone", "+233241234567", ["sms", "whatsapp"])).toBe(
      false,
    );
    expect(h.rpcCalls).toHaveLength(2);
  });

  it("never asks on behalf of an empty subject", async () => {
    expect(await hasAnyMarketingConsent("email", "", CONSENT_CHANNELS)).toBe(false);
    expect(h.rpcCalls).toHaveLength(0);
  });
});

describe("hasContactConsent", () => {
  it("answers false for every channel it was not asked about", async () => {
    h.rpcResult = () => ({ data: true, error: null });
    const out = await hasContactConsent({
      email: "ama@example.com",
      phone: "+233241234567",
      channels: ["email"],
    });
    expect(out).toEqual({ email: true, sms: false, whatsapp: false });
    expect(h.rpcCalls).toHaveLength(1);
  });

  it("does not look up a channel whose identifier is missing", async () => {
    h.rpcResult = () => ({ data: true, error: null });
    const out = await hasContactConsent({
      email: "ama@example.com",
      phone: null,
      channels: CONSENT_CHANNELS,
    });
    expect(h.rpcCalls.map((c) => c.args.p_channel)).toEqual(["email"]);
    expect(out).toEqual({ email: true, sms: false, whatsapp: false });
  });

  it("reads an unreachable ledger as no permission, not as an error", async () => {
    const out = await hasContactConsent({
      email: "ama@example.com",
      phone: "+233241234567",
      channels: CONSENT_CHANNELS,
    });
    expect(out).toEqual({ email: false, sms: false, whatsapp: false });
  });
});
