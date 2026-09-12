"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-border h-14 sticky top-0 z-50 flex items-center px-4 sm:px-6">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber to-amber/70 flex items-center justify-center text-[10px] font-extrabold text-navy">
            KO
          </div>
          <span className="text-base font-extrabold tracking-tight text-navy dark:text-white">
            KlagonOrg
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          {[
            { label: "Events", href: "/events" },
            { label: "Learn", href: "/learning" },
            { label: "Projects", href: "/projects" },
            { label: "Community", href: "/news" },
            { label: "About", href: "/contact" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-medium text-gray hover:text-navy cursor-pointer transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/auth/register">
            <Button size="sm" className="hidden sm:inline-flex">
              Join KlagonOrg
            </Button>
          </Link>
          <button
            className="sm:hidden p-1.5 rounded-lg hover:bg-light cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size="20" /> : <Menu size="20" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-border p-4 sm:hidden shadow-lg animate-fade-in">
          <div className="flex flex-col gap-3">
            {[
              { label: "Events", href: "/events" },
              { label: "Learn", href: "/learning" },
              { label: "Projects", href: "/projects" },
              { label: "Community", href: "/news" },
              { label: "About", href: "/contact" },
            ].map((link) => (
              <Link key={link.label} href={link.href} className="text-sm font-medium text-gray hover:text-navy cursor-pointer">
                {link.label}
              </Link>
            ))}
            <Link href="/auth/register" className="w-full">
              <Button size="sm" className="w-full mt-2">Join KlagonOrg</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
