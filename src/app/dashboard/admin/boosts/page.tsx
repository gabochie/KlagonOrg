"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { BoostRequestsQueue } from "@/components/admin/BoostRequestsQueue";

export default function AdminBoostsPage() {
  return (
    <RequireAdmin>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-navy mb-1">Boost requests</h1>
        <p className="text-xs text-gray mb-5">
          Confirm the WhatsApp payment first, then apply. The tier and price come from the
          listing, so they always match what the seller was quoted.
        </p>
        <BoostRequestsQueue />
      </div>
    </RequireAdmin>
  );
}
