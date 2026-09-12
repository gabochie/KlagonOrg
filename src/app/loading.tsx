export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-navy animate-pulse" />
        <div className="text-sm font-semibold text-gray animate-pulse">Loading...</div>
      </div>
    </div>
  );
}
