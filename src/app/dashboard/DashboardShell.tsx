"use client";

import { useEffect, useState, type ReactNode } from "react";
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

  // Escape closes it, matching the public Navbar's mobile menu.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer((d) => ({ ...d, open: false }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh md:h-dvh md:overflow-hidden bg-light md:grid md:grid-cols-[220px_1fr] md:grid-rows-[auto_1fr]">
      <Topbar
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

      <Sidebar open={drawerOpen} />

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