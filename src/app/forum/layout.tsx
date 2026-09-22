import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Forum",
  description:
    "Discussion boards for Klagon — ask questions, share updates, explore culture and give feedback. Anyone can read; members start the conversation.",
  alternates: { canonical: "/forum" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}