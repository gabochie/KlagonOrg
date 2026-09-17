import Link from "next/link";
import { QUICK_ACTIONS } from "@/lib/constants";

export function QuickActions() {
  return (
    <div>
      <div className="text-xs font-bold text-navy mb-2">Quick Actions</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {QUICK_ACTIONS.map((a) => {
          const inner = (
            <>
              <div className="text-lg mb-1.5">{a.icon}</div>
              <div className="text-[11px] font-bold text-navy">{a.label}</div>
              <div className="text-[10px] text-gray mt-0.5">{a.sub}</div>
            </>
          );
          const cls =
            "block h-full bg-white border border-border rounded-lg py-3 px-2.5 text-center cursor-pointer hover:border-amber transition-colors font-sans";
          return a.href ? (
            <Link key={a.label} href={a.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={a.label} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}