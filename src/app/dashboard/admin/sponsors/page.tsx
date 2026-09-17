"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { SponsorAdminContent } from "@/components/admin/sponsor-admin/SponsorAdminContent";

export default function AdminSponsorsPage() {
  return (
    <RequireAdmin>
      <SponsorAdminContent />
    </RequireAdmin>
  );
}