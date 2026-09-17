import type { PostStatus } from "@/types";

const STYLES: Record<PostStatus, string> = {
  pending: "bg-amber/15 text-amber-strong border-amber/40",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-700 border-red-500/30",
  hidden: "bg-gray-100 text-gray-700 border-border",
};

const LABELS: Record<PostStatus, string> = {
  pending: "Pending",
  approved: "Live",
  rejected: "Needs changes",
  hidden: "Hidden",
};

export function PostStatusChip({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}