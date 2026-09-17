import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Community Post — KlagonOrg",
  description: "A community post from Klagon and Tema West members.",
  alternates: { canonical: "/news" },
};

export default function NewsPostLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
