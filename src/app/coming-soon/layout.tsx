import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "New KlagonOrg features are on the way.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}