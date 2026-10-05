"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Menu, X } from "lucide-react";

export function Topbar({
  drawerOpen,
  onToggleDrawer,
}: {
  /** Only meaningful below `md`; the desktop layout has no drawer. */
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const isSuper = pathname.startsWith("/dashboard/super");
  const isAdmin = pathname.includes("/admin") || isSuper;
  const isMemberArea = isAdmin || pathname.includes("/dashboard");

  const firstName = profile?.full_name.trim().split(/\s+/)[0] ?? "";
  const initials = profile?.full_name
    ? profile.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0] ?? "")
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    // `pt-[env(safe-area-inset-top)]` is required here, not optional polish.
    // The app sets `viewportFit: "cover"` with `statusBarStyle:
    // "black-translucent"`, so in iOS standalone the web view starts at the top
    // of the screen and content renders underneath the status bar and Dynamic
    // Island. The public Navbar already compensates this way; without the same
    // treatment the KO mark, title, theme toggle, bell and Sign out all sit
    // under the notch on a notched iPhone. Padding (not margin) so the inset
    // pushes the bar's own content down and the navy fill still reaches the
    // top edge.
    <header className="col-span-full bg-navy pt-[env(safe-area-inset-top)] flex items-center justify-between gap-2 px-4 sm:px-5 border-b border-white/8">
      <div className="flex items-center gap-2.5 min-w-0">
        {/*
          Hamburger for the drawer. `md:hidden` because the sidebar is a
          permanent column above the breakpoint and needs no toggle. 44px
          square to meet the touch-target floor the rest of the app holds to
          (see BottomNav.tsx).
        */}
        <button
          type="button"
          onClick={onToggleDrawer}
          aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={drawerOpen}
          aria-controls="dashboard-sidebar"
          className="md:hidden min-h-11 min-w-11 -ml-1 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-[30px] h-[30px] rounded-lg bg-amber flex items-center justify-center text-[11px] font-extrabold text-navy">
            KO
          </div>
          <span className="text-xs font-bold text-white">
            {isAdmin ? "KLAGON.org Admin" : "KLAGON.org"}
          </span>
        </Link>
        {isAdmin && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/25 tracking-wide">
            {isSuper ? "SUPER" : "ADMIN"}
          </span>
        )}
        {isMemberArea && !isAdmin && profile && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/35 tracking-wide">
            {profile.role.replace("_", " ").toUpperCase().replace(/^./, (c) => c.toUpperCase())}
          </span>
        )}
      </div>
      {/*
        `shrink-0` so the actions never get squeezed; `gap-2` instead of
        `gap-3` below `sm` because the row also has to hold the hamburger.
        The name is dropped under `sm`: at 390px the full name, bell, theme
        toggle and Sign out cannot all fit, and the avatar already identifies
        the account.
      */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-white/45 text-xs cursor-text">
            🔍 Search members, events&hellip;
          </div>
        )}
        <ThemeToggle dark />
        <NotificationsBell />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/8 border border-white/12">
          <div className="w-6 h-6 rounded-full bg-amber flex items-center justify-center text-[9px] font-bold text-navy">
            {initials}
          </div>
          <span className="hidden sm:inline text-xs text-white/85 font-medium max-w-28 truncate">
            {firstName || "Member"}
          </span>
        </div>
        <button
          onClick={() => void signOut()}
          className="text-[11px] font-bold text-white/60 hover:text-amber transition-colors cursor-pointer shrink-0"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}