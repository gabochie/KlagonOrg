import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join KLAGON.org",
  description: "Create a free member account and join Klagon's youth community today.",
  alternates: { canonical: "/auth/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}