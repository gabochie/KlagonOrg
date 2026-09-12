import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your KlagonOrg member account.",
  alternates: { canonical: "/auth/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}