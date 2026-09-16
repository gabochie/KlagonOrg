import type { Metadata } from "next";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your KlagonOrg profile and password.",
  alternates: { canonical: "/dashboard/settings" },
};

export default function SettingsPage() {
  return <SettingsPanel />;
}