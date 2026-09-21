/* KLAGON WA Auto-Sender — popup logic. No PII leaves this browser. */

const $ = (id) => document.getElementById(id);
const statusEl = $("status");

function show(s) {
  chrome.storage.local.get(["run"], ({ run }) => {
    const r = run || {};
    const lines = [
      `state: ${r.state || "idle"}`,
      `progress: ${r.index || 0}/${(r.items || []).length} items`,
      `sent: ${(r.log || []).filter((e) => e.status === "sent").length} failed: ${(r.log || []).filter((e) => e.status === "failed").length}`,
      r.note ? `note: ${r.note}` : null,
      s || null,
    ].filter(Boolean);
    statusEl.textContent = lines.join("\n");
  });
}

async function readBatchFile(file) {
  const text = await file.text();
  const batch = JSON.parse(text);
  if (!batch || batch.version !== 1 || !Array.isArray(batch.items)) {
    throw new Error("Not a KLAGON auto-batch file (version 1 with items).");
  }
  for (const it of batch.items) {
    if (!it || typeof it.id !== "string" || typeof it.waPhone !== "string" || typeof it.text !== "string") {
      throw new Error("Batch has a malformed item — re-export from the Outreach Queue.");
    }
  }
  return batch;
}

$("start").addEventListener("click", async () => {
  try {
    const f = $("batchFile").files[0];
    if (!f) return show("Pick a batch file first.");
    const batch = await readBatchFile(f);
    const minD = Math.max(20, Number($("minDelay").value) || 60);
    const maxD = Math.max(minD, Number($("maxDelay").value) || 150);
    const cap = Math.min(200, Math.max(1, Number($("maxPerRun").value) || 60));
    const run = {
      state: "running",
      items: batch.items.slice(0, cap),
      template: batch.template || "",
      index: 0,
      log: [],
      settings: { minDelaySec: minD, maxDelaySec: maxD, dryRun: $("dryRun").checked },
      note: $("dryRun").checked ? "DRY RUN — nothing will be sent" : "LIVE — messages will be sent",
      startedAt: new Date().toISOString(),
    };
    await chrome.storage.local.set({ run });
    show(`Run armed with ${run.items.length} items. Switch to the WhatsApp Web tab (logged in as 026 870 8895) — sending starts there automatically.`);
  } catch (e) {
    show(`Could not start: ${e.message}`);
  }
});

async function setState(state) {
  const { run } = await chrome.storage.local.get(["run"]);
  if (!run) return show("No run loaded.");
  run.state = state;
  await chrome.storage.local.set({ run });
  show();
}

$("pause").addEventListener("click", () => setState("paused"));
$("resume").addEventListener("click", () => setState("running"));
$("stop").addEventListener("click", () => setState("stopped"));

$("exportLog").addEventListener("click", async () => {
  const { run } = await chrome.storage.local.get(["run"]);
  if (!run || !run.log || run.log.length === 0) return show("No sender log yet — run something first.");
  const blob = new Blob([JSON.stringify({ items: run.log }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "klagon-sender-log.json";
  a.click();
  URL.revokeObjectURL(a.href);
  show("Sender log downloaded — import it in the Outreach Queue to reconcile.");
});

setInterval(() => show(), 2000);
show();
