"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAdminMetrics, fetchAdminEvents, fetchPublicEvents } from "@/lib/queries";

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
  { icon: "📚", label: "Learning Hub", href: "/learning" },
  { icon: "📅", label: "Events", href: "/events" },
  { icon: "🏗️", label: "Projects", href: "/projects" },
  { icon: "🙋", label: "Volunteer", href: "/volunteer" },
];

const memberAccount: NavItem[] = [
  { icon: "👤", label: "My Profile", href: SOON, soon: true },
  { icon: "🎖️", label: "Achievements", href: SOON, soon: true },
  { icon: "📰", label: "News", href: "/news" },
  { icon: "📸", label: "Gallery", href: SOON, soon: true },
];

const adminMain: NavItem[] = [
  { icon: "📊", label: "Dashboard", href: "/dashboard/admin" },
  { icon: "📡", label: "Command Center", href: "/admin/ops" },
  { icon: "👥", label: "Members", href: SOON, soon: true },
  { icon: "📅", label: "Events", href: SOON, soon: true },
  { icon: "📚", label: "Learning Hub", href: SOON, soon: true },
  { icon: "🏗️", label: "Projects", href: SOON, soon: true },
  { icon: "🙋", label: "Volunteers", href: SOON, soon: true },
];

const adminEngagement: NavItem[] = [
  { icon: "✅", label: "Attendance", href: SOON, soon: true },
  { icon: "📰", label: "Articles", href: SOON, soon: true },
  { icon: "🖼️", label: "Gallery", href: SOON, soon: true },
];

const adminOps: NavItem[] = [
  { icon: "💰", label: "Donations", href: SOON, soon: true },
  { icon: "🤝", label: "Sponsors", href: SOON, soon: true },
  { icon: "🧑‍🏫", label: "Mentors", href: SOON, soon: true },
  { icon: "📈", label: "Analytics", href: SOON, soon: true },
  { icon: "⚙️", label: "Settings", href: SOON, soon: true },
];

function NavSection({ title, items }: { title?: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {title && (
        <div className="px-3 pt-4 pb-1 text-[10px] font-bold tracking-widest uppercase text-gray/60">
          {title}
        </div>
      )}
      {items.map((item) => {
        const active = pathname === item.href && !item.soon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors relative",
              active
                ? "bg-pale text-navy font-bold"
                : "text-gray hover:bg-light hover:text-navy",
            )}
          >
            {active && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-amber" />
            )}
            <span className="text-sm w-[18px] text-center">{item.icon}</span>
            <span>{item.label}</span>
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
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-light text-gray border border-border">
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

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    void (async () => {
      if (isAdmin) {
        const [metrics, events] = await Promise.all([
          fetchAdminMetrics(),
          fetchAdminEvents(),
        ]);
        setPendingCount(metrics.pendingCount);
        setUpcomingCount(events.length);
      } else {
        const events = await fetchPublicEvents();
        setUpcomingCount(events.length);
      }
    })();
  }, [profile, isAdmin]);

  const isAdminRoute = pathname.includes("/admin");
  const showAdminMenu = isAdminRoute && isAdmin;

  const withBadges = (items: NavItem[]): NavItem[] =>
    items.map((item) => {
      if (item.label === "Members" && pendingCount > 0) {
        return { ...item, badge: { count: pendingCount } };
      }
      if (item.label === "Events" && upcomingCount > 0) {
        return { ...item, badge: { count: upcomingCount } };
      }
      return item;
    });

  const navItems = showAdminMenu
    ? [
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
    <aside className="bg-white border-r border-border overflow-y-auto flex flex-col">
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
          <NavSection key={section.title} title={section.title} items={section.items} />
        ))}
      </nav>

      {!showAdminMenu && (
        <div className="p-3 border-t border-border mt-auto">
          <div className="bg-light rounded-lg p-2.5 text-center">
            <div className="text-lg mb-1">🧑‍🏫</div>
            <div className="text-xs font-bold text-navy mb-0.5">Need a mentor?</div>
            <div className="text-[10px] text-gray">Connect with someone who&apos;s walked this path</div>
            <Link href="/mentor" className="mt-2 w-full block py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold text-center font-sans hover:bg-blue transition-colors">
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
