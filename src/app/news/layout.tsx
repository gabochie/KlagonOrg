import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Community",
  description: "Updates, stories and announcements from the KlagonOrg community.",
  alternates: { canonical: "/news" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}