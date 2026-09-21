# KLAGON WA Auto-Sender (private staff tool, zero cost)

Hands-free sending of Outreach Queue batches through WhatsApp Web on the
KLAGON line (**026 870 8895**). No API, no subscriptions, no per-message fees.

## How it works

1. Admin → Outreach Queue → work the gates as usual → **Export auto-batch**.
   Only gated, sendable (verified + phone + consent + not STOP) rows are
   exported. The gate is the consent boundary — this tool never decides
   who is sendable.
2. Open this extension → load the batch file → **leave Dry run ON** first.
3. Switch to the WhatsApp Web tab (logged in as 026 870 8895). The tool opens
   each chat, waits like a human, and either previews (dry run) or sends.
4. **Export sender log** → back in the Outreach Queue → **Import sender log**.
   Sent/failed reconcile to Supabase (`outreach_sends`); dry-run previews
   stay pending so the live run still picks them up.

## Install (2 minutes, free)

1. Chrome/Edge → `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder (`tools/wa-auto-sender`).
3. Pin the extension. Open `web.whatsapp.com` and log in with 026 870 8895.
4. Never publish this to any store, never share the zip outside staff.

## Safety rules (read before the first live run)

- **Dry run first, every new batch shape.** Verify chats open with the right
  text before a single message sends.
- **Pace:** defaults 60–150s random between sends. Never go below ~45s.
- **Volume:** one number = max **~60 sends/day**, business hours only
  (8am–6pm). In the queue, set Staff numbers = 1 and Per day ≤ 60 when only
  026 870 8895 is sending. New/warm numbers start at ~20/day for a week.
- **STOP is law:** anyone replying STOP gets marked in the queue (STOP button)
  → lands in `outreach_suppressions` → never exported again.
- **Stay logged in:** if WhatsApp Web logs out mid-run, the run pauses safely.
  Re-log-in, press Resume. A run also resumes after a browser restart.
- **If WhatsApp changes its layout:** the sender marks items `failed` instead
  of misfiring. Ping the dev to update the selectors in `content.js`
  (search for `COMPOSER_SEL` / `SEND_BTN_SEL`).
- **Ban risk is real but manageable:** this mimics human pacing on
  consent-gated contacts. Spammy bursts, bought lists, or 200+/day on one
  number will get 026 870 8895 restricted — the caps above exist for that.

## Files

- `manifest.json` — MV3, permission scoped to `web.whatsapp.com` only.
- `popup.html` / `popup.js` — batch loading, pace settings, run control.
- `content.js` — sequential sender on WhatsApp Web.
- Batch/log formats are versioned (`version: 1`) and validated on both ends
  (`buildAutoBatch` / `parseSenderLog` in `src/lib/outreach.ts`).
