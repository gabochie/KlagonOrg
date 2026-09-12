import { ADMIN_EVENTS } from "@/lib/constants";
import { Button } from "@/components/ui";

export function UpcomingEvents() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy">Upcoming Events</div>
        <Button size="sm" variant="secondary">Manage</Button>
      </div>
      {ADMIN_EVENTS.map((e) => {
        const d = new Date(e.date);
        return (
          <div
            key={e.id}
            className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0"
          >
            <div className="w-9 h-9 rounded-lg bg-light flex flex-col items-center justify-center flex-shrink-0">
              <div className="text-[8px] font-bold text-gray uppercase">
                {d.toLocaleString("en", { month: "short" })}
              </div>
              <div className="text-sm font-extrabold text-navy leading-none">{d.getDate()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-navy truncate">{e.title}</div>
              <div className="text-[11px] text-gray">
                {e.time} · {e.rsvpCount > 0 ? `${e.rsvpCount} RSVPs` : "Open"}
              </div>
            </div>
            <div className="text-[11px] font-bold text-amber">
              {e.rsvpCount > 0 ? `${e.rsvpCount} ↗` : "Open"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
