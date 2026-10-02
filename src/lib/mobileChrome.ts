/**
 * Single source of truth for where the mobile bottom tab bar is allowed to
 * appear. The dashboard and auth screens have their own chrome, so both the bar
 * and anything that needs to sit above it (the offline banner) key off this.
 */
const HIDDEN_PREFIXES = ["/dashboard", "/admin", "/auth"];

export function shouldHideBottomNav(pathname: string): boolean {
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}