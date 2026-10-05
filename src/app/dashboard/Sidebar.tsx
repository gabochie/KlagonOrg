"use client";

import { useEffect, useState, type Ref } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAdminEvents, fetchPublicEvents } from "@/lib/queries";
import { useIsDesktop } from "@/lib/useMediaQuery";

const SOON = "/dashboard/coming-soon";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: { count: number; red?: boolean };
  soon?: boolean;
}

const memberMenu: NavItem[] = [
  { icon: "🏠", label: "Dashboard", href: "/dashboard/member" },
  { icon: "📚", label: "Digital Academy", href: "/dashboard/learning" },
  { icon: "📅", label: "Events", href: "/dashboard/events" },
  { icon: "🏗️", label: "Projects", href: "/dashboard/projects" },
  { icon: "🙋", label: "Volunteer", href: "/dashboard/volunteer" },
];

const memberAccount: NavItem[] = [
  { icon: "👤", label: "My Profile", href: "/dashboard/settings" },
  { icon: "✍️", label: "Submit Post", href: "/submit" },
  { icon: "📮", label: "My Posts", href: "/my/posts" },
  { icon: "💬", label: "Forum", href: "/forum" },
  { icon: "🎖️", label: "Achievements", href: SOON, soon: true },
  { icon: "📰", label: "News", href: "/dashboard/news" },
  { icon: "📸", label: "Gallery", href: SOON, soon: true },
];

const adminMain: NavItem[] = [
  { icon: "📊", label: "Dashboard", href: "/dashboard/admin" },
  { icon: "🛂", label: "Moderation", href: "/dashboard/admin/moderation" },
  { icon: "📥", label: "Inbox", href: "/dashboard/admin/inbox" },
  { icon: "👥", label: "Members", href: SOON, soon: true },
  { icon: "📅", label: "Events", href: "/dashboard/admin/events" },
  { icon: "📚", label: "Digital Academy", href: "/dashboard/admin/courses" },
  { icon: "🏗️", label: "Projects", href: SOON, soon: true },
  { icon: "🙋", label: "Volunteers", href: "/dashboard/admin/volunteers" },
];

const adminEngagement: NavItem[] = [
  { icon: "✅", label: "Attendance", href: SOON, soon: true },
  { icon: "📰", label: "Articles", href: SOON, soon: true },
  { icon: "🖼️", label: "Gallery", href: SOON, soon: true },
];

const adminOps: NavItem[] = [
  { icon: "💰", label: "Donations", href: SOON, soon: true },
  { icon: "🤝", label: "Sponsors", href: "/dashboard/admin/sponsors" },
  { icon: "⚡", label: "Boosts", href: "/dashboard/admin/boosts" },
  { icon: "🏷️", label: "Listing claims", href: "/dashboard/admin/directory-claims" },
  { icon: "🧑‍🏫", label: "Mentors", href: SOON, soon: true },
  { icon: "📈", label: "Analytics", href: SOON, soon: true },
  { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
];

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {title && (
        // `text-[11px]` rather than `text-[10px]`: below `md` these are the only
        // headings in the drawer, and 10px is below the legibility floor for a
        // touch UI. Desktop gains a hair of size here, which is fine.
        <div className="px-3 pt-4 pb-1 text-[11px] font-bold tracking-widest uppercase text-gray/60">
          {title}
        </div>
      )}
      {items.map((item) => {
        const active = pathname === item.href && !item.soon;
        return (
<Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
              // `min-h-11` (44px) on every row. `py-2` alone gives ~32px, which
              // is under the touch-target floor the rest of the app keeps. The
              // rows are the primary nav on a phone once this is a drawer.
              "flex items-center gap-2.5 mx-1 px-3 min-h-11 rounded-lg text-sm font-medium cursor-pointer transition-colors relative",
              active
                ? "bg-pale text-navy font-bold"
                : "text-gray hover:bg-light hover:text-navy",
            )}
          >
            {active && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-amber" />
            )}
            {/*
              Emoji rather than an icon font. That was a deliberate choice for a
              desktop sidebar and it is not being changed here, but it does mean
              these glyphs render at wildly different visual weights across
              platforms. Worth a follow-up with real icons; out of scope for a
              layout fix.
            */}
            <span className="text-base w-[18px] text-center shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  item.badge.red
                    ? "bg-red-100 text-red-900"
                    : "bg-amber text-navy",
                )}
              >
                {item.badge.count}
              </span>
            )}
            {item.soon && (
              // `text-[11px]`: 9px is unreadable on a phone, and this badge is
              // the only signal that an item is not yet available.
              <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-light text-gray border border-border shrink-0">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function Sidebar({
  open = false,
  ref,
  onNavigate,
}: {
  open?: boolean;
  ref?: Ref<HTMLElement>;
  /**
   * Closes the drawer on tap. Needed in addition to the shell's route-derived
   * close, because tapping the nav link for the page you are already on changes
   * no route, so `pathname` never changes and the drawer would latch open.
   * Matches how the public Navbar's mobile menu closes on every link tap.
   */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const isDesktop = useIsDesktop();
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    void (async () => {
      if (isAdmin) {
        const events = await fetchAdminEvents();
        setUpcomingCount(events.length);
      } else {
        const events = await fetchPublicEvents();
        setUpcomingCount(events.length);
      }
    })();
  }, [profile, isAdmin]);

  const isAdminRoute = pathname.includes("/admin") || pathname.startsWith("/dashboard/super");
  const showAdminMenu = isAdminRoute && isAdmin;

  const superMenu: NavItem[] = isSuperAdmin
    ? [
        { icon: "👑", label: "Super Admin", href: "/dashboard/super" },
        { icon: "📡", label: "Command Center", href: "/dashboard/super/command" },
      ]
    : [];

  const withBadges = (items: NavItem[]): NavItem[] =>
    items.map((item) => {
      if (item.label === "Events" && upcomingCount > 0) {
        return { ...item, badge: { count: upcomingCount } };
      }
      return item;
    });

  const navItems = showAdminMenu
    ? [
        ...(superMenu.length > 0
          ? [{ title: "Platform", items: superMenu }]
          : []),
        { title: "Main", items: withBadges(adminMain) },
        { title: "Engagement", items: adminEngagement },
        { title: "Operations", items: adminOps },
      ]
    : [
        { title: "Menu", items: withBadges(memberMenu) },
        { title: "My Account", items: memberAccount },
      ];

  const name = profile?.full_name?.trim() || "Member";
  const xp = profile?.xp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const intoLevel = xp % 100;
  const since = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "";
  const roleLabel = profile?.role === "super_admin" ? "Super Admin" : "Admin";

  return (
    // The single most important line in this component.
    //
    // Below `md` this is `fixed` and translated off-canvas, so it no longer
    // consumes a grid column and the content area gets the full viewport width.
    // Above `md` the `md:` utilities restore it to a permanent 220px column in
    // normal flow, so desktop is byte-for-byte the layout it was.
    //
    // `inert` while closed below `md` removes the off-screen links from the tab
    // order and from the accessibility tree. Without it a keyboard user tabs
    // through an invisible menu, which is worse than the original bug.
    // `overscroll-contain` stops a flick inside the drawer from chaining to the
    // page behind it.
    <aside
      id="dashboard-sidebar"
      ref={ref}
      aria-label="Dashboard navigation"
      // Resolved in JS rather than CSS, because `inert` is a DOM attribute and
      // cannot be scoped to a breakpoint. On desktop this is a permanent column
      // and must stay interactive even while `open` is false, because the
      // drawer state is meaningless there.
      inert={!isDesktop && !open ? true : undefined}
      className={cn(
        "bg-white border-border flex flex-col overflow-y-auto overscroll-contain",
        // Drawer: fixed, full height, slid off-canvas when closed.
        "fixed inset-y-0 left-0 z-50 w-[min(17rem,85vw)] border-r shadow-2xl transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: back to being a column, never translated.
        "md:static md:z-auto md:w-auto md:shadow-none md:translate-x-0 md:border-r",
      )}
    >
      {!showAdminMenu && (
        <div className="px-3 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-blue flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0">
              {initialsOf(name)}
            </div>
            <div>
              <div className="text-xs font-bold text-navy">{name}</div>
              {since && <div className="text-[10px] text-gray">Member since {since}</div>}
            </div>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-gray font-semibold">XP Progress · Level {level}</span>
            <strong className="text-[10px] text-amber font-bold">{xp} XP</strong>
          </div>
          <div className="h-1.5 bg-light rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber to-coral"
              style={{ width: `${intoLevel}%` }}
            />
          </div>
          <div className="text-[10px] text-gray mt-1">
            {100 - intoLevel} XP to unlock Level {level + 1}
          </div>
        </div>
      )}

      <nav className="flex-1 pb-4">
        {navItems.map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            items={section.items}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {!showAdminMenu && (
        <div className="p-3 border-t border-border mt-auto">
          <div className="bg-light rounded-lg p-2.5 text-center">
            <div className="text-lg mb-1">🧑‍🏫</div>
            <div className="text-xs font-bold text-navy mb-0.5">Need a mentor?</div>
            <div className="text-[10px] text-gray">Connect with someone who&apos;s walked this path</div>
            <Link
          href="/mentor"
          onClick={onNavigate}
          className="mt-2 w-full block py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold text-center font-sans hover:bg-blue transition-colors"
        >
              Find a Mentor
            </Link>
          </div>
        </div>
      )}

      {showAdminMenu && (
        <div className="p-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-full bg-pale flex items-center justify-center text-[10px] font-bold text-blue">
              {initialsOf(name)}
            </div>
            <div>
              <div className="text-xs font-bold text-navy">{name}</div>
              <div className="text-[10px] text-gray">{roleLabel}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
