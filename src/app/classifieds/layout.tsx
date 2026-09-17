import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Classifieds & Marketplace — KlagonOrg",
  description:
    "Buy, sell, and find work in Klagon and Tema West: properties, vehicles, goods, services, and jobs posted by the community.",
  alternates: { canonical: "/classifieds" },
};

export default function ClassifiedsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
