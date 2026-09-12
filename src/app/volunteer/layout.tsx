import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Open roles like Youth Mentor, Event Coordinator and Digital Literacy Tutor. Join in and give back.",
  alternates: { canonical: "/volunteer" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}