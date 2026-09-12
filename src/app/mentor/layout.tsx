import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentors",
  description:
    "Share your skills and experience with Klagon's youth. Apply to become a mentor today.",
  alternates: { canonical: "/mentor" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}