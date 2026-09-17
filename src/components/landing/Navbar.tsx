"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Learn", href: "/learning" },
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "Map", href: "/map" },
  { label: "Classifieds", href: "/classifieds" },
  { label: "Community", href: "/news" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const closeMenu = () => setOpen(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dashboardHref =
    profile?.role === "admin" || profile?.role === "super_admin"
      ? "/dashboard/admin"
      : "/dashboard/member";

  const signedIn = !loading && Boolean(user);

  return (
    <nav className="bg-white border-b border-border h-14 sticky top-0 z-50 flex items-center px-4 sm:px-6 dark:bg-ink-2">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/brand/klagon-logo.png" alt="KlagonOrg" className="h-9 w-auto" />
          <span className="text-base font-extrabold tracking-tight text-navy dark:text-white">
            KLAGON<span className="text-amber-strong dark:text-amber">org</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  active
                    ? "bg-pale text-navy font-bold dark:bg-white/10 dark:text-white"
                    : "text-gray hover:bg-light hover:text-navy dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div
            className="hidden md:flex items-center gap-2 w-[190px] justify-end"
            aria-live="polite"
          >
            {signedIn ? (
              <Link href={dashboardHref}>
                <Button size="sm" className="whitespace-nowrap">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button size="sm" variant="outline" className="whitespace-nowrap">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="whitespace-nowrap">
                    Join KlagonOrg
                  </Button>
                </Link>
              </>
            )}
          </div>
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-light dark:hover:bg-white/8 cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="absolute top-14 left-0 right-0 bg-white border-b border-border p-4 sm:p-5 md:hidden shadow-lg animate-fade-in dark:bg-ink-2"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-pale text-navy font-bold dark:bg-white/10 dark:text-white"
                      : "text-gray hover:bg-light hover:text-navy dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 dark:border-white/10">
              {signedIn ? (
                <Link href={dashboardHref} onClick={closeMenu}>
                  <Button size="sm" className="w-full">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={closeMenu}>
                    <Button size="sm" variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={closeMenu}>
                    <Button size="sm" className="w-full">
                      Join KlagonOrg
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}