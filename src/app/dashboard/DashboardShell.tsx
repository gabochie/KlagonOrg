"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useIsDesktop } from "@/lib/useMediaQuery";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Dashboard chrome: sidebar + topbar + scrolling content.
 *
 * This exists as its own component because the open/closed state has to be
 * shared between the Topbar's hamburger and the Sidebar it controls, and the
 * dashboard layout is a server component that cannot hold state.
 *
 * Layout strategy, and why it is `min-h-dvh` rather than `h-dvh`:
 *
 *  - Above `md`, the old two-column grid is preserved exactly: a fixed 220px
 *    sidebar and a 1fr content area. Desktop behaviour is unchanged.
 *  - Below `md`, the sidebar is an overlay drawer instead of a column. It used
 *    to sit permanently at 220px, which left the content 170px wide on a
 *    390px phone. Every card inside was then laid out in that sliver.
 *
 * The row heights are `auto`/`1fr` rather than the old fixed `52px` for the
 * header. A fixed header row cannot accommodate `env(safe-area-inset-top)`:
 * the inset would be added on top of a 52px box and squeeze the content
 * instead of padding it away from the notch. With `auto`, the Topbar grows to
 * 52px plus whatever the inset is.
 *
 * `min-h-dvh` lets the page scroll as one document on mobile, which is what a
 * phone expects and what keeps `position: fixed` bottom-anchored children
 * behaving. The old `h-screen overflow-hidden` split scrolling into `main`,
 * which is right for a desktop app shell but fights the iOS URL bar and any
 * future mobile bottom chrome. `main` still owns its own overflow at `md` and
 * above, where the two-pane shell needs to scroll independently.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();

  // Drawer state is stored together with the route it was opened on, then
  // derived. Doing this instead of closing it from an effect matters for two
  // reasons, both of which the lint rule flags as cascading renders:
  //
  //  - Navigating (including programmatically, via a redirect or the back
  //    button) changes `pathname`, so the stale `openFor` no longer matches and
  //    the drawer closes with no effect at all.
  //  - Rotating to landscape or resizing past `md` flips `isDesktop`, which
  //    forces `open` false, so the drawer cannot latch open over the
  //    two-column layout.
  //
  // Both were real failure modes of a naive `useEffect(() => setOpen(false))`.
  const [drawer, setDrawer] = useState<{ open: boolean; openFor: string }>({
    open: false,
    openFor: pathname,
  });
  const drawerOpen = drawer.open && drawer.openFor === pathname && !isDesktop;

  /**
   * A drawer that is visually modal has to be modally inert, too. Measured on a
   * Pixel 5 with the drawer open: Tab walked 28 focus stops into `main` before
   * cycling back, and `window.scrollBy(0, 400)` moved the page underneath the
   * scrim. Both are real — a keyboard user could operate a control they cannot
   * see, and the content could slide out from under the drawer.
   *
   * So three things, all scoped to the open drawer and all torn down on close:
   *
   *  - `inert` on `main` and `Topbar`'s siblings takes the background out of the
   *    tab order entirely. `inert` is the right tool over a hand-rolled focus
   *    trap because it also stops screen readers and click-through, and it does
   *    not need per-render bookkeeping of what is focusable.
   *  - The body scroll lock uses fixed positioning so it survives iOS Safari,
   *    where setting `overflow: hidden` on `body` does not stop the document
   *    scrolling. The scroll offset is restored on close so the page does not
   *    jump.
   *  - Focus moves into the drawer on open and returns to the hamburger on
   *    close, so the toggle is not orphaned when the drawer dismisses.
   */
  const shellRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;

    // Capture the toggle before the drawer steals focus, so it can be restored.
    // `toggleRef` rather than `document.activeElement`, because the toggle sits
    // in the `Topbar` and the shell only makes siblings inert below.
    const restoreTo = toggleRef.current ?? (document.activeElement as HTMLElement | null);

    // Background out of the tab order. The aside itself must stay reachable,
    // which is why this walks children rather than the shell.
    for (const child of Array.from(shellRef.current?.children ?? [])) {
      if (child.id !== "dashboard-sidebar" && child.tagName !== "SCRIPT") {
        child.setAttribute("inert", "");
      }
    }

    // Fixed-body lock with scroll restoration.
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";

    // Move focus into the drawer, otherwise the next Tab lands on the first
    // control in the header rather than the first nav link.
    const firstLink = sidebarRef.current?.querySelector<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    firstLink?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer((d) => ({ ...d, open: false }));
        return;
      }
      // Tab must cycle inside the drawer rather than escaping to the page.
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter(
        (el) =>
          // Not inside an inert subtree. Checked via attribute rather than
          // `offsetParent`, because offsetParent is layout-dependent and is
          // always null in jsdom, which silently disables the whole trap in
          // tests — the trap must not be unobservable.
          !el.closest("[inert]") &&
          !el.hidden &&
          el.getAttribute("aria-hidden") !== "true",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflowY = prev.overflowY;
      for (const child of Array.from(shellRef.current?.children ?? [])) {
        child.removeAttribute("inert");
      }
      // Only restore if focus is still inside the dismissed drawer; a click on
      // a nav link should let focus follow the navigation instead.
      if (
        sidebarRef.current?.contains(document.activeElement) ||
        document.activeElement === document.body
      ) {
        restoreTo?.focus?.();
      }
    };
  }, [drawerOpen]);

  return (
    <div
      ref={shellRef}
      className="min-h-dvh md:h-dvh md:overflow-hidden bg-light md:grid md:grid-cols-[220px_1fr] md:grid-rows-[auto_1fr]"
    >
      <Topbar
        toggleRef={toggleRef}
        drawerOpen={drawerOpen}
        onToggleDrawer={() =>
          setDrawer((d) => ({ open: !d.open, openFor: pathname }))
        }
      />

      {/*
        Scrim. `md:hidden` because above the breakpoint there is no drawer to
        dismiss. Kept as a sibling rather than inside the aside so clicking it
        cannot hit a nav link underneath.
      */}
      <div
        aria-hidden="true"
        onClick={() => setDrawer((d) => ({ ...d, open: false }))}
        className={`md:hidden fixed inset-0 z-40 bg-navy/50 transition-opacity duration-200 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <Sidebar
        open={drawerOpen}
        ref={sidebarRef}
        onNavigate={() => setDrawer((d) => ({ ...d, open: false }))}
      />

      {/*
        `min-w-0` is load-bearing. Without it this flex/grid child refuses to
        shrink below its content's intrinsic min-content width, so one wide
        table inside is enough to push the whole column past the viewport and
        reintroduce sideways scrolling for every page.
      */}
      {/*
        `min-w-0` is load-bearing. Without it this flex/grid child refuses to
        shrink below its content's intrinsic min-content width, so one wide
        table inside is enough to push the whole column past the viewport and
        reintroduce sideways scrolling for every page.

        `overflow-x-clip` is the backstop for the same problem. It clips rather
        than scrolls, so a too-wide child can never produce a horizontal
        scrollbar on the page. Deliberately not `overflow-x-auto`: the report
        this addresses noted controls *were* reachable by side-scrolling a
        170px window, which is technically "not broken" and practically
        unusable. Nothing here needs sideways paging once the sidebar is a
        drawer, and `overflow-x-auto` on an ancestor would silently re-enable
        it. Anything genuinely wide should carry its own `overflow-x-auto`,
        which MembersTable's table already does.
      */}
      <main className="min-w-0 overflow-x-clip p-4 sm:p-5 flex flex-col gap-4 md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}