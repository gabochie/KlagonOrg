import { test, expect } from "@playwright/test";

/**
 * Regression cover for the PWA install affordance.
 *
 * The install prompt shipped a permanently broken icon: it used `next/image`,
 * the only such usage in the repo, and a static export has no `/_next/image`
 * optimizer. The markup pointed at
 * `/_next/image/?url=%2Ficon-192.png&w=96&q=75`, which 404s, so the icon
 * rendered with `naturalWidth === 0`.
 *
 * Nothing caught it. Lint passed (a `no-img-element` warning looked
 * harmless). Typecheck passed. The build passed. The suite passed, because
 * `beforeinstallprompt` never fires in headless Chromium and no test ever
 * opened the prompt. A visitor tapping "Install KLAGON to your home screen"
 * on a phone saw a broken image.
 *
 * These tests dispatch a synthetic `beforeinstallprompt` so the prompt
 * actually mounts, then assert the thing that was broken: the icon resolves
 * and decodes. The prompt is also asserted on `/learning`, because it used to
 * be mounted only in app/page.tsx — so the page the crest hero points at could
 * never offer install.
 */

const PROMPT = '[role="dialog"][aria-label="Install KLAGON.org"]';

function fireInstallPrompt() {
  const event = new Event("beforeinstallprompt");
  // The component only ever calls prompt() on a user gesture.
  (event as Event & { prompt: () => Promise<void> }).prompt = async () => {};
  Object.defineProperty(event, "userChoice", {
    value: Promise.resolve({ outcome: "dismissed" }),
  });
  window.dispatchEvent(event);
}

async function openPrompt(page: import("@playwright/test").Page, path: string) {
  // `networkidle` matters: `beforeinstallprompt` is a one-shot event and the
  // listener only exists once React has hydrated. Dispatching at `load` loses
  // it, so re-fire until the dialog is actually mounted.
  await page.goto(path, { waitUntil: "networkidle" });

  const prompt = page.locator(PROMPT);
  await expect(async () => {
    await page.evaluate(fireInstallPrompt);
    await expect(prompt).toHaveCount(1, { timeout: 250 });
  }).toPass({ timeout: 15000 });

  return prompt;
}

test("install prompt offers install on the homepage", async ({ page }) => {
  const prompt = await openPrompt(page, "/");
  await expect(prompt).toBeVisible();
  // `exact` matters: without it the name match is a case-insensitive
  // substring, so "Install" also resolves the "Dismiss install prompt" button.
  await expect(prompt.getByRole("button", { name: "Install", exact: true })).toBeVisible();
  await expect(prompt.getByRole("button", { name: "Not now", exact: true })).toBeVisible();
});

test("install prompt is offered on /learning, not just the homepage", async ({ page }) => {
  // Regression: the prompt lived in app/page.tsx, so every route except "/"
  // silently had no install affordance.
  const prompt = await openPrompt(page, "/learning");
  await expect(prompt).toBeVisible();
});

test("install prompt icon actually loads", async ({ page }) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });

  const prompt = await openPrompt(page, "/");
  const icon = prompt.locator("img");
  await expect(icon).toHaveCount(1);

  const src = await icon.getAttribute("src");
  // The optimizer URL is the exact shape that 404s under output: "export".
  expect(src, "icon must not point at the image optimizer").not.toContain("/_next/image");

  // naturalWidth is the real assertion: a broken image still has a src.
  await expect
    .poll(async () => icon.evaluate((el: HTMLImageElement) => el.naturalWidth), {
      message: `icon failed to decode (src=${src})`,
      timeout: 15000,
    })
    .toBeGreaterThan(0);

  expect(failures, "no request may fail while the prompt mounts").toEqual([]);
});

test("dismissing the prompt keeps it hidden for that visitor", async ({ page }) => {
  const prompt = await openPrompt(page, "/");
  await expect(prompt).toBeVisible();

  await prompt.getByRole("button", { name: "Not now", exact: true }).click();
  await expect(prompt).toHaveCount(0);

  await page.reload();
  await expect(page.locator(PROMPT)).toHaveCount(0);
});

test("the installed app is configured to launch standalone", async ({ page, request }) => {
  const manifest = await request.get("/manifest.json");
  expect(manifest.ok()).toBeTruthy();
  const m = await manifest.json();
  expect(m.display).toBe("standalone");
  expect(m.start_url).toBe("/");
  expect(m.scope).toBe("/");
  // /learning must sit inside scope, or the academy is unreachable once installed.
  expect("/learning".startsWith(m.scope)).toBe(true);
  expect(m.icons.length).toBeGreaterThanOrEqual(3);

  await page.goto("/");
  const html = await page.content();
  expect(html).toContain('rel="manifest"');
  expect(html).toContain("viewport-fit=cover");
});