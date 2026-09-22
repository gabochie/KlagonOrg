// ------------------------------------------------------------------
// Observability env helpers — pure, unit-tested.
// Everything here degrades to "disabled" when the corresponding public
// variable is absent, so local dev and CI work with zero setup:
//   NEXT_PUBLIC_SENTRY_DSN        (sentry.io free project -> Settings -> Client Keys)
//   NEXT_PUBLIC_CF_BEACON_TOKEN   (Cloudflare dashboard -> Analytics & Logs
//                                  -> Web Analytics -> Add site -> token)
// Both values are PUBLIC (they ship in the client bundle by design).
// ------------------------------------------------------------------

export function sentryDsn(value?: string): string | null {
  const dsn = (value ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? "").trim();
  return /^https:\/\/[^\s@]+@[^\s]+\/\d+$/.test(dsn) ? dsn : null;
}

export function cfBeaconToken(value?: string): string | null {
  const token = (value ?? process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "").trim();
  return token.length >= 8 ? token : null;
}

export function sentryEnvironment(value?: string): string {
  const env = (value ?? process.env.NEXT_PUBLIC_SENTRY_ENV ?? "").trim();
  return env || (process.env.NODE_ENV === "development" ? "development" : "production");
}
