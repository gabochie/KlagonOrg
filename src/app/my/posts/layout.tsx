import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Posts — KLAGON.org",
  description: "Track your community submissions: pending review, approved, or returned with notes.",
  alternates: { canonical: "/my/posts" },
};

export default function MyPostsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
