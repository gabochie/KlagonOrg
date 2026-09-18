import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Manage Listing — KlagonOrg",
  description: "Update your business listing: photos, prices, hours, and review replies.",
  alternates: { canonical: "/my/posts" },
};

export default function ManageBusinessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
