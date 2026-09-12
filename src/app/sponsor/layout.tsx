import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsorships",
  description:
    "Sponsorship tiers and partnership opportunities supporting Klagon's youth programs.",
  alternates: { canonical: "/sponsor" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}