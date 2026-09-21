import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Culture Hub",
  description:
    "Festivals, performances, music and the stories behind them — Klagon, Ghana. Propose a cultural event or share your story.",
  alternates: { canonical: "/culture" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}