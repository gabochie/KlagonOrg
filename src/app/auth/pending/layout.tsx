import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership Review",
  description: "Your KlagonOrg membership is being reviewed.",
  alternates: { canonical: "/auth/pending" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}