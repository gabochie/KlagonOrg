import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Field Kit — KLAGON.org",
  description: "Staff visit flow: the 10-minute shop script with photo and consent capture.",
  alternates: { canonical: "/submit" },
};

export default function FieldLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
