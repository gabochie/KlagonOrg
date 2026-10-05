import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "./DashboardShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}