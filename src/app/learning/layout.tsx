import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klagon Digital Academy",
  description:
    "Free learning tracks in AI & Tech, Financial Literacy, Leadership, Entrepreneurship, Communication and Career Planning.",
  alternates: { canonical: "/learning" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}