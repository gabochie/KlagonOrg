"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchMyClaim, fileClaim } from "@/lib/claims";

export function ClaimBusiness({
  sponsorId,
  sponsorName,
  claimedBy,
}: {
  sponsorId: string;
  sponsorName: string;
  claimedBy: string | null;
}) {
  const { user, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void fetchMyClaim(sponsorId, user.id).then((c) => {
      if (c) setStatus(c.status);
    });
  }, [sponsorId, user]);

  if (loading) return null;
  if (claimedBy && user && claimedBy === user.id) {
    return (
      <div className="bg-pale border border-border rounded-2xl p-5">
        <div className="text-sm font-extrabold text-navy mb-1">You manage this listing</div>
        <p className="text-xs text-gray mb-3">
          Update photos, prices, and reply to reviews.
        </p>
        <Link href={`/my/business/${sponsorId}`}>
          <Button variant="primary">Manage Listing →</Button>
        </Link>
      </div>
    );
  }
  if (claimedBy) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Log in to claim this business.");
      return;
    }
    setSending(true);
    setError(null);
    const res = await fileClaim({
      sponsorId,
      claimantId: user.id,
      phone,
      relationship,
      note,
    });
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "Claim failed.");
      return;
    }
    setStatus("pending");
  }

  if (status) {
    return (
      <div className="bg-pale border border-border rounded-2xl p-5">
        <div className="text-sm font-extrabold text-navy mb-1">
          Claim {status === "approved" ? "approved" : status === "rejected" ? "not approved" : "under review"}
        </div>
        <p className="text-xs text-gray">
          {status === "pending" &&
            "Our team is verifying your connection to this business. Check back soon."}
          {status === "rejected" &&
            "This claim wasn't approved. Contact us if you believe that's a mistake."}
          {status === "approved" && "Refresh to manage your listing."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="text-sm font-extrabold text-navy mb-1">Own this business?</div>
      <p className="text-xs text-gray mb-3">
        Claim {sponsorName} to update photos and prices and reply to reviews. Free, verified by
        our team.
      </p>
      {!user ? (
        <Link href="/auth/login">
          <Button variant="dark">Log In to Claim →</Button>
        </Link>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              label="Your phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0244 000 000"
            />
            <Input
              label="Your role"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Owner / Manager / Staff"
            />
          </div>
          <Input
            label="Anything to help us verify (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shop location, landmark…"
          />
          {error && <div className="text-xs font-semibold text-red-700">{error}</div>}
          <Button variant="primary" disabled={sending}>
            {sending ? "Submitting…" : "Claim This Business →"}
          </Button>
        </form>
      )}
    </div>
  );
}
