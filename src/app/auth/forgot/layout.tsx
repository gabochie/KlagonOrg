import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Request a password reset link for your KlagonOrg account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/forgot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}