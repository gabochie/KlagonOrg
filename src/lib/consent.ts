import { getBrowserClient } from "@/lib/supabase-browser";
import { recordLeadEvent } from "@/lib/analytics";

/**
 * Marketing consent, the thing every send path must check before it contacts
 * anyone.
 *
 * The rule this module exists to enforce: no row in `marketing_consents` means
 * no permission, and "no permission" means do not send. Every helper here is
 * built around that default-deny reading so a caller cannot accidentally treat
 * an unknown person as opted in.
 *
 * Nothing here is permission to send *service* messages — transactional
 * notices (a payment confirmation, a walk booking reply, a claim that a staff
 * member is reviewing) are a separate basis and are deliberately not recorded
 * as consent, so that recording marketing consent cannot be mistaken for
 * waiving it later.
 *
 * Where a sender is actually built, do not hand-roll the check. The newsletter
 * list already has one: `marketable_subscribers` (migration
 * 20261008000000_marketable_subscribers) returns only the (subscriber, channel)
 * pairs with permission on file, and `subscribers` itself is the wrong table to
 * read for a send. The WhatsApp outreach gate has its own equivalent in
 * `gateRecord()` in src/lib/outreach.ts.
 */

export type MarketingChannel = "email" | "sms" | "whatsapp";
export type ConsentSubjectType = "email" | "phone" | "profile";

/**
 * Bump when the consent wording on screen changes. The value is stored with
 * each row, so an audit can prove which text the person actually saw.
 *
 * 2026-10 — first version: explicit unticked opt-in naming each channel.
 */
export const CONSENT_TEXT_VERSION = "2026-10";

/** The wording version, exported so the UI and the ledger cannot drift. */
export const CONSENT_CHANNELS: readonly MarketingChannel[] = ["email", "sms", "whatsapp"];

export interface ConsentRecord {
  subject_type: ConsentSubjectType;
  subject_value: string;
  channel: MarketingChannel;
  granted: boolean;
  form_source: string;
  context?: string | null;
}

/** Normalise the subject so "A@B.com" and "a@b.com" never split a consent. */
function normalizeSubject(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Persist one channel's decision. Called from form submit handlers only —
 * never from a component body, or React 18's double render would record a
 * consent nobody made.
 *
 * Fails soft on purpose: a ledger write problem must not block someone from
 * sending us a message, and the sending gate already denies by default, so a
 * lost row means we simply never market to them. Availability is sacrificed
 * in favour of permission, never the other way round.
 *
 * Returns the error rather than throwing, so callers can surface it when the
 * interaction is consent-first (the newsletter, the learning gate) where a
 * failed record genuinely invalidates the opt-in.
 */
export async function recordConsent(rec: ConsentRecord): Promise<{ error: string | null }> {
  const client = getBrowserClient();
  if (!client) return { error: "Supabase is not configured." };
  if (!rec.subject_value.trim()) return { error: "Nothing to record consent for." };

  const { error } = await client.from("marketing_consents").insert({
    subject_type: rec.subject_type,
    subject_value: normalizeSubject(rec.subject_value),
    channel: rec.channel,
    granted: rec.granted,
    form_source: rec.form_source,
    consent_text_version: CONSENT_TEXT_VERSION,
    context: rec.context ?? null,
  });
  if (error) return { error: error.message };

  recordLeadEvent({
    source: rec.form_source,
    action: rec.granted ? "consent-granted" : "consent-declined",
    metadata: { channel: rec.channel },
  });
  return { error: null };
}

/**
 * Record every channel from one form in a single interaction, so a person
 * ticking a single box gives the whole set they were shown rather than
 * whatever the caller remembered to pass.
 */
export async function recordConsentBatch(opts: {
  subject_type: ConsentSubjectType;
  subject_value: string;
  channels: readonly MarketingChannel[];
  granted: boolean;
  form_source: string;
  context?: string | null;
}): Promise<{ error: string | null }> {
  let firstError: string | null = null;
  for (const channel of opts.channels) {
    const { error } = await recordConsent({
      subject_type: opts.subject_type,
      subject_value: opts.subject_value,
      channel,
      granted: opts.granted,
      form_source: opts.form_source,
      context: opts.context,
    });
    if (error) firstError ??= error;
  }
  return { error: firstError };
}

/**
 * May we market to this person on this channel?
 *
 * Throws only when the ledger itself is unreachable, because a network failure
 * and a genuine "no" must not collapse into the same answer — but callers that
 * do not distinguish them will send nothing either way, which is the safe
 * direction.
 *
 * When in doubt, treat `null` as `false`: never send.
 */
export async function hasMarketingConsent(
  subjectType: ConsentSubjectType,
  subjectValue: string,
  channel: MarketingChannel,
): Promise<boolean | null> {
  if (!subjectValue.trim()) return false;
  const client = getBrowserClient();
  if (!client) return null;

  const { data, error } = await client.rpc("marketing_consent", {
    p_subject_type: subjectType,
    p_subject_value: normalizeSubject(subjectValue),
    p_channel: channel,
  });
  if (error) return null;
  // No row ever recorded -> we never asked -> we do not have permission.
  return data === true;
}

/**
 * Check a whole form's worth of answers at once, for callers that want to
 * decide a single "may we go ahead" rather than reasoning channel by channel.
 */
export async function hasAnyMarketingConsent(
  subjectType: ConsentSubjectType,
  subjectValue: string,
  channels: readonly MarketingChannel[],
): Promise<boolean> {
  for (const channel of channels) {
    const verdict = await hasMarketingConsent(subjectType, subjectValue, channel);
    if (verdict === true) return true;
  }
  return false;
}

/** Wording helpers shared by every form, so one consent sentence is used site-wide. */
export function channelList(channels: readonly MarketingChannel[]): string {
  const label: Record<MarketingChannel, string> = {
    email: "email",
    sms: "SMS",
    whatsapp: "WhatsApp",
  };
  const parts = channels.map((c) => label[c]);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}`;
}

/**
 * Which identifier a channel travels under. Email marketing is looked up by
 * email; SMS and WhatsApp are looked up by phone, because that is the
 * identifier a sender actually holds when it goes to message someone.
 */
export function subjectForChannel(channel: MarketingChannel): ConsentSubjectType {
  return channel === "email" ? "email" : "phone";
}

export interface ContactConsentOpts {
  email?: string | null;
  phone?: string | null;
  channels: readonly MarketingChannel[];
  granted: boolean;
  form_source: string;
  context?: string | null;
}

/**
 * Record one tick from a form that collects an email address and, sometimes,
 * a phone number.
 *
 * A channel with no identifier on hand is skipped rather than guessed. If they
 * ticked the box but left the phone blank, there is nothing to send to, and a
 * number that turns up later will find no row and be denied by default.
 * Substituting a placeholder subject would make the ledger look complete
 * without being able to prove who agreed.
 *
 * Refusals are recorded too, so "they said no" stays distinguishable from "we
 * never asked" instead of collapsing into one blank.
 */
export async function recordContactConsent(
  opts: ContactConsentOpts,
): Promise<{ error: string | null }> {
  let firstError: string | null = null;
  for (const channel of opts.channels) {
    const subjectType = subjectForChannel(channel);
    const value = subjectType === "email" ? opts.email : opts.phone;
    if (!value?.trim()) continue;
    const { error } = await recordConsent({
      subject_type: subjectType,
      subject_value: value,
      channel,
      granted: opts.granted,
      form_source: opts.form_source,
      context: opts.context,
    });
    if (error) firstError ??= error;
  }
  return { error: firstError };
}

/**
 * Which of these channels may be used for this contact? Any channel whose
 * identifier is missing stays false, so a sender cannot read absence as
 * permission.
 */
/**
 * Record consent for someone who already has an account.
 *
 * Keyed by profile id rather than by an address or a number, so changing the
 * email on a profile cannot silently orphan their permission — and a reused
 * phone number cannot inherit it.
 */
export async function recordProfileConsent(opts: {
  profile_id: string;
  channels: readonly MarketingChannel[];
  granted: boolean;
  form_source: string;
  context?: string | null;
}): Promise<{ error: string | null }> {
  if (!opts.profile_id) return { error: "No profile to record consent for." };
  let firstError: string | null = null;
  for (const channel of opts.channels) {
    const { error } = await recordConsent({
      subject_type: "profile",
      subject_value: opts.profile_id,
      channel,
      granted: opts.granted,
      form_source: opts.form_source,
      context: opts.context,
    });
    if (error) firstError ??= error;
  }
  return { error: firstError };
}

/**
 * Read back what is on file for a contact. Defaults every channel to false:
 * an unreachable ledger sends nothing, which is the safe direction to fail.
 */
export async function hasContactConsent(
  opts: { email?: string | null; phone?: string | null; channels: readonly MarketingChannel[] },
): Promise<Record<MarketingChannel, boolean>> {
  const out: Record<MarketingChannel, boolean> = { email: false, sms: false, whatsapp: false };
  for (const channel of opts.channels) {
    const subjectType = subjectForChannel(channel);
    const value = subjectType === "email" ? opts.email : opts.phone;
    if (!value?.trim()) continue;
    const verdict = await hasMarketingConsent(subjectType, value, channel);
    out[channel] = verdict === true;
  }
  return out;
}
