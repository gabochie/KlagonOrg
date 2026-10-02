"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChevronDown, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Explore", href: "/map" },
  { label: "Learn", href: "/learning" },
  { label: "Businesses", href: "/business" },
  { label: "Jobs", href: "/jobs" },
  { label: "Classifieds", href: "/classifieds" },
  { label: "Visit", href: "/visit" },
];

const MORE_LINKS = [
  { label: "Events", href: "/events" },
  { label: "The Culture Hub", href: "/culture" },
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "Community", href: "/news" },
  { label: "Forum", href: "/forum" },
  { label: "📻 Radio", href: "/radio" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Donate", href: "/donate" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const closeMenu = () => setOpen(false);

  const moreActive = MORE_LINKS.some(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`)
  );

  // Close the mobile menu / More dropdown on Escape.
  useEffect(() => {
    if (!open && !moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMoreOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, moreOpen]);

  // Close the More dropdown on outside click.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  // Lock background scroll while the mobile sheet is open, then restore it.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  // Trap focus inside the mobile sheet and restore it to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu) return;

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    menu.querySelector<HTMLElement>("[data-menu-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(menu.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !menu.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !menu.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const dashboardHref =
    profile?.role === "super_admin"
      ? "/dashboard/super"
      : profile?.role === "admin"
        ? "/dashboard/admin"
        : "/dashboard/member";

  const signedIn = !loading && Boolean(user);

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 dark:bg-ink-2">
      <div className="min-h-14 pt-[env(safe-area-inset-top)] flex items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/brand/klagon-logo.png" alt="KLAGON.org" className="h-9 w-auto rounded-lg" />
          <span className="text-base font-extrabold tracking-tight text-navy dark:text-white">
            KLAGON<span className="text-amber-strong dark:text-amber">.org</span>
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

          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer",
                moreActive
                  ? "bg-pale text-navy font-bold dark:bg-white/10 dark:text-white"
                  : "text-gray hover:bg-light hover:text-navy dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white",
              )}
            >
              More
              <ChevronDown
                size={12}
                className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 min-w-[190px] bg-white border border-border rounded-xl shadow-lg p-1.5 z-50 dark:bg-ink-2 dark:border-white/10"
              >
                {MORE_LINKS.map((link) => {
                  const active =
                    pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "block px-3 py-2 rounded-lg text-xs font-medium transition-colors",
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
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div
            className="hidden md:flex items-center gap-2 w-auto justify-end"
            aria-live="polite"
          >
            <Link href="/donate">
              <Button
                size="sm"
                className="whitespace-nowrap bg-amber text-navy hover:bg-amber/90 border-transparent"
              >
                ♥ Donate
              </Button>
            </Link>
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
                    Join KLAGON.org
                  </Button>
                </Link>
              </>
            )}
          </div>
          <button
            ref={triggerRef}
            className="md:hidden min-h-11 min-w-11 p-2 rounded-lg hover:bg-light dark:hover:bg-white/8 cursor-pointer flex items-center justify-center"
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
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="absolute top-full left-0 right-0 max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] overflow-y-auto overscroll-contain bg-white border-b border-border p-4 sm:p-5 md:hidden shadow-lg animate-fade-in dark:bg-ink-2"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  data-menu-autofocus={i === 0 ? "" : undefined}
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
            <div className="mt-3 border-t border-border pt-3 dark:border-white/10">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray dark:text-white/40">
                More
              </div>
              {MORE_LINKS.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);
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
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 pb-[env(safe-area-inset-bottom)] dark:border-white/10">
              <Link href="/donate" onClick={closeMenu}>
                <Button size="sm" className="w-full bg-amber text-navy hover:bg-amber/90 border-transparent">
                  ♥ Donate
                </Button>
              </Link>
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
                      Join KLAGON.org
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