import type { ReactNode } from "react";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { OpsShell } from "@/components/ops/OpsShell";

export default function AdminOpsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <OpsShell>{children}</OpsShell>
    </RequireAdmin>
  );
}