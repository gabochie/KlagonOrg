"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { DirectoryClaimsQueue } from "@/components/admin/DirectoryClaimsQueue";

export default function AdminDirectoryClaimsPage() {
  return (
    <RequireAdmin>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-navy mb-1">Listing claims</h1>
        <p className="text-xs text-gray mb-5">
          Owners claiming one of the <span className="font-bold">/business</span> directory listings. Message the
          claimant first and ask for something only the owner would know, then approve. Approval is what puts the
          verified badge on the page. An undecided claim also blocks any new claim on that listing, so clear these
          daily.
        </p>
        <DirectoryClaimsQueue />
      </div>
    </RequireAdmin>
  );
}
