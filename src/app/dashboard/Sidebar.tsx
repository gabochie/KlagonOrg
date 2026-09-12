"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: { count: number; red?: boolean };
}

const memberMenu: NavItem[] = [
  { icon: "🏠", label: "Dashboard", href: "/dashboard/member" },
  { icon: "📚", label: "Learning Hub", href: "#" },
  { icon: "📅", label: "Events", href: "#", badge: { count: 4 } },
  { icon: "🏗️", label: "Projects", href: "#" },
  { icon: "🙋", label: "Volunteer", href: "#" },
];

const memberAccount: NavItem[] = [
  { icon: "👤", label: "My Profile", href: "#" },
  { icon: "🎖️", label: "Achievements", href: "#" },
  { icon: "💬", label: "Messages", href: "#", badge: { count: 2, red: true } },
  { icon: "📰", label: "News", href: "#" },
  { icon: "📸", label: "Gallery", href: "#" },
];

const adminMain: NavItem[] = [
  { icon: "📊", label: "Dashboard", href: "/dashboard/admin" },
  { icon: "👥", label: "Members", href: "#", badge: { count: 7 } },
  { icon: "📅", label: "Events", href: "#", badge: { count: 4 } },
  { icon: "📚", label: "Learning Hub", href: "#" },
  { icon: "🏗️", label: "Projects", href: "#" },
  { icon: "🙋", label: "Volunteers", href: "#" },
];

const adminEngagement: NavItem[] = [
  { icon: "✅", label: "Attendance", href: "#" },
  { icon: "📰", label: "Articles", href: "#" },
  { icon: "🖼️", label: "Gallery", href: "#" },
  { icon: "💬", label: "Messages", href: "#", badge: { count: 3 } },
];

const adminOps: NavItem[] = [
  { icon: "💰", label: "Donations", href: "#" },
  { icon: "🤝", label: "Sponsors", href: "#" },
  { icon: "🧑‍🏫", label: "Mentors", href: "#" },
  { icon: "📈", label: "Analytics", href: "#" },
  { icon: "⚙️", label: "Settings", href: "#" },
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
        const active = pathname === item.href;
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
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = pathname.includes("/admin");
  const isMember = pathname.includes("/member");

  const navItems = isAdmin
    ? [
        { title: "Main", items: adminMain },
        { title: "Engagement", items: adminEngagement },
        { title: "Operations", items: adminOps },
      ]
    : [
        { title: "Menu", items: memberMenu },
        { title: "My Account", items: memberAccount },
      ];

  return (
    <aside className="bg-white border-r border-border overflow-y-auto flex flex-col">
      {isMember && (
        <div className="px-3 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-blue flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0">
              AK
            </div>
            <div>
              <div className="text-xs font-bold text-navy">Ama Kofi</div>
              <div className="text-[10px] text-gray">Member since July 2025</div>
            </div>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-gray font-semibold">XP Progress · Level 4</span>
            <strong className="text-[10px] text-amber font-bold">340 / 500 XP</strong>
          </div>
          <div className="h-1.5 bg-light rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber to-coral"
              style={{ width: "68%" }}
            />
          </div>
          <div className="text-[10px] text-gray mt-1">
            160 XP to unlock Level 5 — Community Builder
          </div>
        </div>
      )}

      <nav className="flex-1 pb-4">
        {navItems.map((section) => (
          <NavSection key={section.title} title={section.title} items={section.items} />
        ))}
      </nav>

      {isMember && (
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

      {isAdmin && (
        <div className="p-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-full bg-pale flex items-center justify-center text-[10px] font-bold text-blue">
              EK
            </div>
            <div>
              <div className="text-xs font-bold text-navy">Emmanuel Kumi</div>
              <div className="text-[10px] text-gray">Super Admin</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
