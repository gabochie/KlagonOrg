import Link from "next/link";

export default function DashboardComingSoon() {
  return (
    <div className="bg-white rounded-xl border border-border p-10 text-center max-w-md mx-auto mt-10">
      <div className="text-4xl mb-3">🚧</div>
      <div className="text-base font-extrabold text-navy mb-1">Coming soon</div>
      <p className="text-xs text-gray leading-relaxed mb-5">
        We&apos;re still building this section of the dashboard. Check back shortly —
        everything else around here already works.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:bg-blue transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
