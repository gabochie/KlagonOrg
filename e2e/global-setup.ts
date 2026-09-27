import type { FullConfig } from "@playwright/test";

/**
 * Guard against testing the wrong site.
 *
 * This machine hosts several projects at once, and Playwright's
 * `reuseExistingServer` will happily point the whole suite at whatever else
 * already owns the configured port. That happened here: port 3100 was serving
 * an unrelated static app, so all 24 tests "failed" against a stranger's HTML
 * and the real conclusions were lost.
 *
 * `reuseExistingServer: false` in playwright.config.ts stops Playwright from
 * adopting a foreign server. This check is the second line of defence: it
 * asserts the server we are about to test is actually Klagon's static export,
 * with per-route HTML and a React Server Component payload. Fail here, loudly,
 * before wasting a run.
 */
const DEAD_COURSE_MARKER = "unavailable or unpublished";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) throw new Error("[e2e] no baseURL configured");

  const fail = (why: string, detail: string) => {
    throw new Error(
      `[e2e] Refusing to run against ${baseURL}: ${why}\n${detail}\n` +
        `If the port is occupied by another project, change the port and baseURL in playwright.config.ts.`
    );
  };

  const home = await fetch(`${baseURL}/`);
  if (!home.ok) fail("server did not respond 200", `GET / -> ${home.status}`);
  const homeHtml = await home.text();

  if (!/KLAGON/i.test(homeHtml)) {
    fail(
      "the response is not a KLAGON.org page",
      `GET / returned ${homeHtml.length} bytes with no KLAGON branding.`
    );
  }

  const learning = await fetch(`${baseURL}/learning`);
  if (!learning.ok) fail("server did not respond 200", `GET /learning -> ${learning.status}`);
  const learningHtml = await learning.text();

  if (learningHtml.length === homeHtml.length && learningHtml === homeHtml) {
    fail(
      "every route returns identical HTML, so this is not a per-route static export",
      `GET / and GET /learning both returned ${homeHtml.length} identical bytes.`
    );
  }

  if (!learningHtml.includes("self.__next_f")) {
    fail(
      "the export is missing its React Server Component payload, so nothing will hydrate",
      "GET /learning contained no self.__next_f push payload."
    );
  }

  const sample = await fetch(`${baseURL}/learning`);
  const sampleHtml = await sample.text();
  if (sampleHtml.includes(DEAD_COURSE_MARKER)) {
    fail(
      "the build baked 'course unavailable' into a learning page",
      "This is the known dead-page failure. Re-run `npm run build`."
    );
  }

  console.log(`[e2e] target verified: ${baseURL} is a Klagon static export.`);
}
