const DATA = [
  { label: "Wk1", value: 4, pct: 20 },
  { label: "Wk2", value: 9, pct: 35 },
  { label: "Wk3", value: 14, pct: 48 },
  { label: "Wk4", value: 21, pct: 58 },
  { label: "Wk5", value: 36, pct: 70 },
  { label: "Wk6", value: 49, pct: 80 },
  { label: "Wk7", value: 61, pct: 88 },
  { label: "Wk8", value: 73, pct: 100 },
];

const barColor = (i: number) => {
  if (i === DATA.length - 1) return "#0F1B5C";
  if (i >= DATA.length - 3) return "#475569";
  return "#CBD5E1";
};

export function BarChart() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-navy">Member Registrations</div>
          <div className="text-[11px] text-gray mt-0.5">Weekly growth toward 100-member goal</div>
        </div>
        <select className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-navy bg-white font-sans cursor-pointer">
          <option>Last 8 weeks</option>
          <option>Last 4 weeks</option>
        </select>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {DATA.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-navy">{d.value}</span>
            <div
              className="w-full rounded-t-md cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                height: `${d.pct}%`,
                background: barColor(i),
                minHeight: 4,
              }}
            />
            <span className="text-[9px] text-gray">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-amber" style={{ width: "73%" }} />
        </div>
        <span className="text-[11px] font-bold text-navy">73 / 100</span>
      </div>
    </div>
  );
}
