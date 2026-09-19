import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The Wetland & Market Walk — Discover Klagon",
  description:
    "A 4-hour community-narrated walk through Klagon: market, kitchen, lagoon at golden hour. GH₵750 per person, plus birding and night editions.",
  alternates: { canonical: "/visit/walk" },
};

export default function WalkLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
