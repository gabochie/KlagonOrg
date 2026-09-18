import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Visit Klagon — Stays, Food & Things To Do",
  description:
    "Visiting Klagon or Tema West? Find verified guesthouses and short-stays, places to eat, and things to do — reviewed by visitors and our team.",
  alternates: { canonical: "/visit" },
};

export default function VisitLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
