import { test, expect, type Page } from "@playwright/test";

/**
 * Regression coverage for the mobile dashboard drawer, as a real phone.
 *
 * This exists because the layout fix in #21 was verified structurally in jsdom,
 * and jsdom cannot catch either defect below. Both need a real layout engine and
 * a real focus model:
 *
 *  1. The page scrolled underneath an open drawer, so content slid out from
 *     under the scrim.
 *  2. Tab walked 28 stops into `main` before returning to the drawer, so a
 *     keyboard user could operate controls they could not see.
 *
 * Scoped to the `mobile` project on purpose. That project skips authed specs to
 * avoid tripling sign-ins against two shared throwaway accounts, so this signs
 * in once per test and stays out of the shared-account pool: it only reads.
 *
 * Skips without E2E_MEMBER_* credentials rather than failing.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard\//, { timeout: 30_000 });
}

test.describe("mobile dashboard drawer", () => {
  test("locks the page behind the open drawer", async ({ page }) => {
    const email = env("E2E_MEMBER_EMAIL");
    const password = env("E2E_MEMBER_PASSWORD");
    test.skip(!email || !password, "needs E2E_MEMBER creds");
    await login(page, email!, password!);

    await page.getByRole("button", { name: /navigation/i }).click();

    // The drawer covers only part of the viewport, so the page scrolling behind
    // it is visible as content moving under the scrim.
    const moved = await page.evaluate(async () => {
      const before = window.scrollY;
      window.scrollBy(0, 400);
      await new Promise((r) => setTimeout(r, 250));
      return { before, after: window.scrollY };
    });
    expect(moved.after).toBe(moved.before);
  });

  test("keeps keyboard focus inside the open drawer", async ({ page }) => {
    const email = env("E2E_MEMBER_EMAIL");
    const password = env("E2E_MEMBER_PASSWORD");
    test.skip(!email || !password, "needs E2E_MEMBER creds");
    await login(page, email!, password!);

    await page.getByRole("button", { name: /navigation/i }).click();
    // Read the attribute directly rather than via toHaveAttribute: `inert` is a
    // boolean attribute whose value is "", and matcher semantics on an empty
    // value are easy to get wrong.
    await expect
      .poll(() =>
        page
          .locator("#dashboard-sidebar")
          .evaluate((el) => el.hasAttribute("inert")),
      )
      .toBe(false);

    // Well past the drawer's ~12 links, so this cannot pass by never reaching
    // the end of the drawer.
    let landedInMain = 0;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const inMain = await page.evaluate(
        () => !!document.querySelector("main")?.contains(document.activeElement),
      );
      if (inMain) landedInMain++;
    }
    expect(landedInMain).toBe(0);
  });

  test("opens and closes without horizontal overflow", async ({ page }) => {
    const email = env("E2E_MEMBER_EMAIL");
    const password = env("E2E_MEMBER_PASSWORD");
    test.skip(!email || !password, "needs E2E_MEMBER creds");
    await login(page, email!, password!);

    const toggle = page.getByRole("button", { name: /navigation/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    const drawer = page.locator("#dashboard-sidebar");
    await toggle.click();
    await expect
      .poll(() => drawer.evaluate((el) => el.hasAttribute("inert")))
      .toBe(false);

    // Fully on-screen while open: x at 0, not parked off the left edge.
    // Polled because the drawer slides in over 200ms, so an immediate
    // boundingBox() reads the start of the transition.
    await expect
      .poll(async () => Math.round((await drawer.boundingBox())?.x ?? -999))
      .toBe(0);

    await page.keyboard.press("Escape");
    const closedBox = await drawer.boundingBox();
    expect(closedBox?.x ?? 0).toBeLessThan(0);
  });

  // The narrowest phone still in real use. A drawer sized in `vw` or a
  // two-column card grid will pass at 393px and fail here.
  test("has no horizontal overflow at 320px", async ({ page }) => {
    const email = env("E2E_MEMBER_EMAIL");
    const password = env("E2E_MEMBER_PASSWORD");
    test.skip(!email || !password, "needs E2E_MEMBER creds");
    await page.setViewportSize({ width: 320, height: 640 });
    await login(page, email!, password!);

    for (const route of ["/dashboard/member", "/dashboard/events"]) {
      await page.goto(route);
      await page.waitForTimeout(800);
      const widths = await page.evaluate(() => ({
        vw: window.innerWidth,
        sw: document.documentElement.scrollWidth,
      }));
      expect(widths.sw, `${route} overflows at 320px`).toBeLessThanOrEqual(
        widths.vw + 1,
      );
    }
  });
});