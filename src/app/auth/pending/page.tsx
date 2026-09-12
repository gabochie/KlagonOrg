"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PendingPage() {
  const { profile, isApproved, user, refreshProfile } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const status = profile?.status ?? "none";
  const address = user?.email ?? "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-sm font-extrabold">
            KO
          </div>
          <span className="text-base font-bold text-navy">KlagonOrg</span>
        </div>

        {isApproved ? (
          <>
            <div className="text-3xl mb-3">🎉</div>
            <h1 className="text-lg font-extrabold text-navy mb-1">You&apos;re in!</h1>
            <p className="text-sm text-gray mb-6">
              Your membership is approved. Head to your dashboard to start.
            </p>
            <Link
              href="/dashboard"
              className="inline-block w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold text-center hover:bg-blue transition-colors font-sans"
            >
              Go to Dashboard
            </Link>
          </>
        ) : status === "rejected" ? (
          <>
            <div className="text-3xl mb-3">💬</div>
            <h1 className="text-lg font-extrabold text-navy mb-1">Application not approved</h1>
            <p className="text-sm text-gray mb-6">
              Please write to hello@klagon.org and we&apos;ll help resolve it quickly.
            </p>
            <Link
              href="/"
              className="inline-block w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold text-center hover:bg-blue transition-colors font-sans"
            >
              Back to Home
            </Link>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber/10 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber" />
              </span>
            </div>
            <h1 className="text-lg font-extrabold text-navy mb-1">
              Your application is under review
            </h1>
            <p className="text-sm text-gray mb-6">
              We&apos;ll review it and notify <span className="font-semibold text-navy">{address}</span>{" "}
              once you&apos;re approved — usually within 24 hours. While you wait, explore the site.
            </p>
            <button
              onClick={async () => {
                setChecking(true);
                await refreshProfile();
                if (isApproved) router.push("/dashboard");
                setChecking(false);
              }}
              disabled={checking}
              className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors font-sans disabled:opacity-60"
            >
              {checking ? "Checking…" : "Check approval status"}
            </button>
            <Link
              href="/"
              className="block w-full mt-3 py-2.5 rounded-lg border border-border text-sm font-bold text-navy text-center hover:border-navy transition-colors font-sans"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}