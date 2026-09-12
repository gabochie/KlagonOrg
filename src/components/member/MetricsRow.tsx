import { MEMBER_METRICS } from "@/lib/constants";

export function MetricsRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {MEMBER_METRICS.map((m) => (
        <div
          key={m.label}
          className="bg-white rounded-xl border border-border p-3 sm:p-3.5 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
            style={{ background: m.accent }}
          />
          <div className="text-[10px] font-bold text-gray uppercase tracking-wider mb-1.5">
            {m.label}
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
            {m.value}
          </div>
          <div className="text-[10px] text-gray mt-1">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}
