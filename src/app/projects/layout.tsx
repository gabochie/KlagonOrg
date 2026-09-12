import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Projects",
  description:
    "Hands-on projects that build skills and improve Klagon, Ghana. See what the community is working on.",
  alternates: { canonical: "/projects" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}