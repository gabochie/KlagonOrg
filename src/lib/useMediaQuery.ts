"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query from JS.
 *
 * Needed for the dashboard drawer because "is the sidebar visible" cannot be
 * answered with CSS alone: below `md` the sidebar is an overlay that must be
 * `inert` and removed from the tab order when closed, and above `md` it is a
 * permanent column that must always be reachable. Both branches live in the
 * same DOM node, so the attribute has to be decided at runtime.
 *
 * Defaults to `false` so the first server-rendered markup matches what a
 * desktop client will keep, and a narrow viewport gets corrected on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Matches Tailwind's default `md`, which is what the dashboard grid breaks at. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 48rem)");
}