import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Workshops, hackathons, leadership sessions and community projects in Klagon, Ghana.",
  alternates: { canonical: "/events" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}