import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Submit a Post — KLAGON.org",
  description:
    "Share news, events, business listings, classifieds, jobs, and announcements with Klagon and Tema West. Free to post; every submission is reviewed before going live.",
  alternates: { canonical: "/submit" },
};

export default function SubmitLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
