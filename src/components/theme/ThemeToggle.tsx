"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle({ dark = false }: { dark?: boolean }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={
        dark
          ? "inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 border border-white/12 text-white/70 hover:text-amber hover:bg-white/12 transition-colors cursor-pointer"
          : "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-light text-navy hover:bg-pale transition-colors cursor-pointer dark:bg-white/8 dark:border-white/12 dark:text-white/70 dark:hover:text-amber dark:hover:bg-white/12"
      }
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}