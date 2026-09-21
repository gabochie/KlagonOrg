/* KLAGON WA Auto-Sender — content script for web.whatsapp.com.
 * Sequential, human-paced sender. Only acts while a run is armed in storage.
 * Navigation-based: each item navigates to its send URL, the reloaded copy
 * resumes from run.pending. Selectors are best-effort; anything
 * unexpected => failed, continue with the next item.
 */
(() => {
  if (window.__klagonSenderActive) return;
  window.__klagonSenderActive = true;

  const COMPOSER_SEL = [
    'div[contenteditable="true"][data-tab="10"]',
    'footer div[contenteditable="true"]',
    'div[contenteditable="true"][data-lexical-editor="true"]',
  ];
  const SEND_BTN_SEL = [
    'button span[data-icon="send"]',
    'button span[data-icon="send-round"]',
  ];
  const STEP_TIMEOUT_MS = 45000;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  async function getRun() {
    const { run } = await chrome.storage.local.get(["run"]);
    return run || null;
  }
  async function setRun(run) {
    await chrome.storage.local.set({ run });
  }

  function queryAny(list) {
    for (const sel of list) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch { /* try next */ }
    }
    return null;
  }

  async function waitFor(fn, timeoutMs, label) {
    const start = Date.now();
    for (;;) {
      const el = fn();
      if (el) return el;
      if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${label}`);
      await sleep(500);
    }
  }

  function pageSaysInvalidNumber() {
    const t = document.body ? document.body.innerText : "";
    return /phone number shared via url is invalid|not on whatsapp/i.test(t);
  }

  function sendUrlFor(item) {
    return `https://web.whatsapp.com/send?phone=${encodeURIComponent(item.waPhone)}&text=${encodeURIComponent(item.text)}`;
  }

  /** We are on the item's page when the phone matches the current URL. */
  function onItemPage(item) {
    try {
      const u = new URL(window.location.href);
      return u.pathname.startsWith("/send") && u.searchParams.get("phone") === item.waPhone;
    } catch {
      return false;
    }
  }

  async function finishItem(run, item, status, note) {
    const log = [...(run.log || []), { id: item.id, status, at: new Date().toISOString() }];
    const index = run.index + 1;
    const base = { ...run, log, index, pending: null };
    if (index >= run.items.length) {
      await setRun({ ...base, state: "done", note: "Finished all items." });
      return;
    }
    const waitSec = rand(run.settings.minDelaySec || 60, run.settings.maxDelaySec || 150);
    await setRun({
      ...base,
      note: `${note || ""} Next in ~${Math.round(waitSec)}s (${index}/${run.items.length}). Keep this tab open.`.trim(),
    });
    await sleep(waitSec * 1000);
  }

  async function workPending(run) {
    const item = run.pending;
    try {
      if (pageSaysInvalidNumber()) throw new Error("invalid number / not on WhatsApp");
      const composer = await waitFor(() => queryAny(COMPOSER_SEL), STEP_TIMEOUT_MS, "composer");
      await waitFor(
        () => (composer.innerText && composer.innerText.trim().length > 3 ? composer : null),
        STEP_TIMEOUT_MS,
        "prefilled text"
      );
      if (pageSaysInvalidNumber()) throw new Error("invalid number / not on WhatsApp");
      if (!run.settings.dryRun) {
        const sendIcon = await waitFor(() => queryAny(SEND_BTN_SEL), STEP_TIMEOUT_MS, "send button");
        (sendIcon.closest("button") || sendIcon).click();
        await sleep(4000); // let the message leave the outbox
        await finishItem(await getRun(), item, "sent");
      } else {
        await sleep(1500); // dry run: look, don't touch
        await finishItem(await getRun(), item, "skipped", "Dry run — nothing sent.");
      }
    } catch (e) {
      const fresh = (await getRun()) || run;
      await finishItem(fresh, item, "failed", `Failed ${item.id} (${e && e.message ? e.message : e}).`);
    }
  }

  async function tick() {
    try {
      const run = await getRun();
      if (!run || run.state !== "running" || !Array.isArray(run.items)) return;
      if (run.pending) {
        if (!onItemPage(run.pending)) {
          window.location.href = sendUrlFor(run.pending); // reload resumes here
          return;
        }
        await workPending(run);
        return;
      }
      if (run.index >= run.items.length) {
        await setRun({ ...run, state: "done", note: "Finished all items." });
        return;
      }
      const item = run.items[run.index];
      await setRun({ ...run, pending: item });
      window.location.href = sendUrlFor(item); // reload resumes here
    } catch {
      /* storage hiccup — retry next tick */
    }
  }

  setInterval(tick, 3000);
})();
