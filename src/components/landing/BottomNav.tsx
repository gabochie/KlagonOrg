"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Home, Plus, Store, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { shouldHideBottomNav } from "@/lib/mobileChrome";

/**
 * Persistent bottom tab bar for the mobile app experience.
 *
 * This is what makes the installed PWA read as an app rather than a shrunk
 * website: a fixed, thumb-reachable set of destinations that never scrolls
 * away. It shows only below `md`, matching the breakpoint where the desktop
 * nav links in Navbar take over, and only on public/content pages — the
 * dashboard and auth screens have their own chrome, so a second nav there
 * would be noise.
 *
 * Placement rules worth keeping:
 *  - `pb-[env(safe-area-inset-bottom)]` so the tabs clear the iOS home
 *    indicator instead of sitting under it.
 *  - Every tab is at least 44px tall; the centre action is a 48px target
 *    lifted above the bar, which is both the most reachable point on a phone
 *    and the clearest way to signal the primary action.
 *  - A spacer is rendered before the bar so the fixed element never covers the
 *    last of the page content or the footer.
 */

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** The one elevated, filled action in the centre of the bar. */
  primary?: boolean;
}

const TABS: Tab[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Discover", href: "/business", icon: Store },
  { label: "Post", href: "/submit", icon: Plus, primary: true },
  { label: "Learn", href: "/learning", icon: GraduationCap },
  { label: "Me", href: "/dashboard", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (shouldHideBottomNav(pathname)) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Reserves the bar's height so it never overlaps the footer. */}
      <div
        aria-hidden="true"
        className="md:hidden h-[calc(3.5rem+env(safe-area-inset-bottom))]"
      />
      <nav
        aria-label="Primary"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:bg-ink-2/95 dark:border-white/10"
      >
        <ul className="flex items-stretch">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;

            // "Me" is the one destination that depends on auth: a signed-out
            // visitor is sent to sign in, since the dashboard would only bounce
            // them there anyway after a spinner.
            const href = tab.href === "/dashboard" && !user ? "/auth/login" : tab.href;

            return (
              <li key={tab.label} className="flex-1 min-w-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 min-h-14 px-1 pt-1.5 text-[11px] font-semibold transition-colors",
                    active
                      ? "text-navy dark:text-white"
                      : "text-gray dark:text-white/60 hover:text-navy dark:hover:text-white",
                  )}
                >
                  {tab.primary ? (
                    <span
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full -mt-5 mb-0.5 shadow-lg transition-colors",
                        active ? "bg-amber text-navy" : "bg-navy text-white",
                      )}
                    >
                      <Icon size={22} />
                    </span>
                  ) : (
                    <Icon size={20} aria-hidden="true" />
                  )}
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}