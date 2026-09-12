"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-extrabold text-coral mb-4">!</div>
        <h1 className="text-xl font-bold text-navy mb-2">Something went wrong</h1>
        <p className="text-sm text-gray mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors font-sans"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
