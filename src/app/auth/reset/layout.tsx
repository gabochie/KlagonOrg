import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Choose a new password for your KlagonOrg account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/reset" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}