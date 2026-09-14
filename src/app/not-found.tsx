import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-extrabold text-navy mb-4">404</div>
        <h1 className="text-xl font-bold text-navy mb-2">Page not found</h1>
        <p className="text-sm text-gray mb-6">
          This page doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
