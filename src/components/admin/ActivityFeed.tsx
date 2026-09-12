import { ACTIVITIES } from "@/lib/constants";

export function ActivityFeed() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy">Recent Activity</div>
        <span className="text-[10px] text-gray">Live</span>
      </div>
      {ACTIVITIES.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-2.5 py-2 border-b border-border last:border-b-0"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
            style={{ background: a.iconBg }}
          >
            {a.icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-navy leading-relaxed">{a.title}</div>
            <div className="text-[10px] text-gray mt-0.5">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
