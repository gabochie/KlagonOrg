import Link from "next/link";
import { ANNOUNCEMENTS } from "@/lib/constants";

export function Announcements() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-navy">Announcements</div>
          <Link href="/news" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
            View All →
          </Link>
      </div>
      {ANNOUNCEMENTS.map((a) => (
        <div key={a.id} className="flex gap-2.5 py-2 border-b border-border last:border-b-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
            style={{ background: a.dotColor }}
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-navy">{a.title}</div>
            <div className="text-[11px] text-gray leading-relaxed">{a.body}</div>
            <div className="text-[10px] text-gray mt-0.5">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
