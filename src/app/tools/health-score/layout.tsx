import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Digital Health Score — KLAGON.org",
  description:
    "Answer 10 quick questions and get your shop's 0–100 digital health score with the 3 fixes that matter most. Free self-check for Klagon, Tema West and Tema Metro businesses.",
  alternates: { canonical: "/tools/health-score" },
};

export default function HealthScoreLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
