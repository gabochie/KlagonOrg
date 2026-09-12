import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support Klagon's youth with a mobile money donation. Every cedi creates opportunity.",
  alternates: { canonical: "/donate" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}