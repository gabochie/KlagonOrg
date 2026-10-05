import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DashboardShell } from "@/app/dashboard/DashboardShell";

/**
 * Regression tests for the dashboard's mobile chrome.
 *
 * The bug these lock down: the dashboard was desktop-only. `layout.tsx` used a
 * bare `grid-cols-[220px_1fr]` with no breakpoint, so on a 390px phone the
 * sidebar held 220px and left 170px for all the content. Every card was laid
 * out in that sliver, 37 elements overflowed the column, and there was no way
 * to dismiss the sidebar because nothing could open or close it.
 *
 * A PWA that invites installs needs its authenticated surface to work at phone
 * width, so this asserts the structural facts rather than pixel measurements:
 * jsdom has no layout engine, so `getBoundingClientRect` is useless here. What
 * can be asserted is which classes and attributes are applied, and that the
 * drawer responds to the interactions.
 */

const pathState = vi.hoisted(() => ({ pathname: "/dashboard/member" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathState.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

/**
 * `matchMedia` is absent from jsdom, so the hook's initial `false` is what the
 * first render sees. Drive it explicitly so each test can pick a breakpoint
 * and, more importantly, so a test can change it to prove the drawer responds
 * to a resize.
 */
const mediaState = vi.hoisted(() => ({
  desktop: false,
  listeners: new Set<(e: { matches: boolean }) => void>(),
}));

vi.stubGlobal("matchMedia", (query: string) => ({
  get matches() {
    return query.includes("48rem") ? mediaState.desktop : false;
  },
  media: query,
  addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
    mediaState.listeners.add(cb);
  },
  removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
    mediaState.listeners.delete(cb);
  },
}));

const authState = vi.hoisted(() => ({
  profile: {
    id: "member-1",
    full_name: "Ada Lovelace",
    role: "member",
    xp: 240,
    created_at: "2026-01-01T00:00:00Z",
  },
  isAdmin: false,
  isSuperAdmin: false,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    profile: authState.profile,
    user: { id: "member-1", email: "ada@example.com" },
    isAdmin: authState.isAdmin,
    isSuperAdmin: authState.isSuperAdmin,
    signOut: vi.fn(),
  }),
}));

// The Sidebar fetches upcoming events for its badge. Return nothing so the
// component settles without a network round-trip.
vi.mock("@/lib/queries", () => ({
  fetchPublicEvents: async () => [],
  fetchAdminEvents: async () => [],
}));

vi.mock("@/components/NotificationsBell", () => ({
  NotificationsBell: () => <button type="button">bell</button>,
}));

vi.mock("@/components/theme/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">theme</button>,
}));

/**
 * Scoped to the most recent container rather than the whole document.
 * `render` appends a fresh container each call, so a document-wide query would
 * find the *first* shell's sidebar — i.e. the one left over from a previous
 * render in the same test, which is exactly what the route-change test needs to
 * assert about.
 */
let container: HTMLElement | null = null;

const sidebar = () =>
  container?.querySelector<HTMLElement>("#dashboard-sidebar") as HTMLElement;

const toggle = () =>
  screen.getByRole("button", { name: /navigation/i }) as HTMLElement;

/**
 * No `@testing-library/jest-dom` in this repo, so `toHaveAttribute` does not
 * exist. Plain DOM assertions keep the component lane dependency-free, same as
 * `AuthProvider.test.tsx`.
 */
const attr = (el: HTMLElement, name: string) => el.getAttribute(name);
const hasInert = (el: HTMLElement) => el.hasAttribute("inert");

function renderShell() {
  const result = render(
    <DashboardShell>
      <div data-testid="content">content</div>
    </DashboardShell>,
  );
  container = result.container;
  return result;
}

beforeEach(() => {
  pathState.pathname = "/dashboard/member";
  mediaState.desktop = false;
  mediaState.listeners.clear();
});

afterEach(() => {
  cleanup();
  container = null;
});

describe("DashboardShell mobile chrome", () => {
  // The core regression. `grid-cols-[220px_1fr]` compiled to an unconditional
  // `grid-template-columns: 220px 1fr`, so the sidebar consumed 56% of a phone
  // viewport. The fix moves the two-column grid behind `md:`.
  it("only reserves a sidebar column at md and above", () => {
    renderShell();

    const shell = sidebar().parentElement as HTMLElement;
    expect(shell.className).toContain("md:grid-cols-[220px_1fr]");
    // The drawer classes are what apply below the breakpoint.
    expect(sidebar().className).toContain("fixed");
    expect(sidebar().className).toContain("-translate-x-full");
  });

  it("restores a static sidebar column on desktop", () => {
    mediaState.desktop = true;
    renderShell();

    expect(sidebar().className).toContain("md:static");
    // Never translated off-canvas when the layout is already two-column.
    expect(sidebar().className).toContain("md:translate-x-0");
  });

  // Without `inert`, a keyboard user tabs straight through an invisible menu.
  // This is the accessibility half of the drawer bug and the easiest to
  // regress, since nothing looks wrong when it happens.
  it("removes the closed drawer from the tab order, and restores it when open", () => {
    renderShell();

    expect(hasInert(sidebar())).toBe(true);

    fireEvent.click(toggle());
    expect(hasInert(sidebar())).toBe(false);
    expect(sidebar().className).toContain("translate-x-0");
  });

  it("never marks the desktop sidebar inert, even with the drawer closed", () => {
    mediaState.desktop = true;
    renderShell();

    // The drawer state is meaningless above the breakpoint: it is a permanent
    // column and must stay reachable whatever the toggle says.
    expect(hasInert(sidebar())).toBe(false);
  });

  it("closes on Escape and on a scrim tap", () => {
    renderShell();

    fireEvent.click(toggle());
    expect(sidebar().className).toContain("translate-x-0");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(sidebar().className).toContain("-translate-x-full");

    fireEvent.click(toggle());
    expect(sidebar().className).toContain("translate-x-0");

    // The scrim is the sibling div with the fixed overlay classes.
    const scrim = screen.getByLabelText("Dashboard navigation").parentElement
      ?.querySelector("div.fixed.inset-0") as HTMLElement;
    expect(scrim).toBeTruthy();
    fireEvent.click(scrim);
    expect(sidebar().className).toContain("-translate-x-full");
  });

  // Navigating must dismiss the drawer. Derived from `pathname` rather than an
  // effect, because a redirect would otherwise leave it latched open.
  it("closes when the route changes", () => {
    const { rerender } = renderShell();

    fireEvent.click(toggle());
    expect(sidebar().className).toContain("translate-x-0");

    // Same component instance, new route. This is the case that matters: a
    // redirect or the back button must dismiss the drawer too, not just a tap
    // on a link.
    pathState.pathname = "/dashboard/events";
    rerender(
      <DashboardShell>
        <div data-testid="content">content</div>
      </DashboardShell>,
    );

    expect(sidebar().className).toContain("-translate-x-full");
  });

  // Rotating to landscape would otherwise strand an open drawer over the
  // two-column layout.
  it("closes when the viewport grows past md", () => {
    const { rerender } = renderShell();

    fireEvent.click(toggle());
    expect(sidebar().className).toContain("translate-x-0");

    // Rotating to landscape re-evaluates the query; the listener fires, then
    // the re-render observes the new value.
    mediaState.desktop = true;
    mediaState.listeners.forEach((cb) => cb({ matches: true }));
    rerender(
      <DashboardShell>
        <div data-testid="content">content</div>
      </DashboardShell>,
    );

    expect(sidebar().className).toContain("-translate-x-full");
  });

  // `viewportFit: "cover"` plus `statusBarStyle: "black-translucent"` means
  // iOS standalone renders under the status bar. The public Navbar compensates;
  // the dashboard Topbar did not, putting the whole header under the notch.
  it("pads the topbar clear of the status bar inset", () => {
    renderShell();

    const header = document.querySelector("header") as HTMLElement;
    expect(header.className).toContain("pt-[env(safe-area-inset-top)]");
  });

  // A fixed `52px` header row cannot hold an inset without squashing its own
  // contents, so the row is `auto` at every width.
  it("lets the header row grow instead of pinning it to 52px", () => {
    renderShell();

    const shell = sidebar().parentElement as HTMLElement;
    expect(shell.className).toContain("md:grid-rows-[auto_1fr]");
    expect(shell.className).not.toContain("grid-rows-[52px_1fr]");
  });

  // One wide child is enough to push the whole column past the viewport, since
  // a grid child will not shrink below its content's min-content width.
  it("lets the content column shrink below its content width", () => {
    renderShell();

    const main = screen.getByTestId("content").parentElement as HTMLElement;
    expect(main.className).toContain("min-w-0");
    // Clips rather than scrolls: a stray wide child must not create a
    // horizontal scrollbar. MembersTable's own table carries overflow-x-auto.
    expect(main.className).toContain("overflow-x-clip");
  });

  it("exposes an accessible toggle below md only", () => {
    renderShell();

    const btn = toggle();
    expect(btn.className).toContain("md:hidden");
    expect(attr(btn, "aria-expanded")).toBe("false");
    // 44px minimum touch target, matching BottomNav.
    expect(btn.className).toContain("min-h-11");
    expect(btn.className).toContain("min-w-11");
    expect(attr(btn, "aria-controls")).toBe("dashboard-sidebar");

    fireEvent.click(btn);
    expect(attr(toggle(), "aria-expanded")).toBe("true");
  });
});