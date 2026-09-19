export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="Sample data shown until this section goes live"
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber/15 text-amber-strong dark:text-amber ${className}`}
    >
      Demo
    </span>
  );
}
