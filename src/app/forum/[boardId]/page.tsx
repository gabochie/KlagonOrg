import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BoardThreads } from "@/components/forum/BoardThreads";
import { FORUM_BOARDS, forumBoardById } from "@/lib/forumBoards";

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return FORUM_BOARDS.map((b) => ({ boardId: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { boardId } = await params;
  const board = forumBoardById(boardId);
  if (!board) return { title: "Forum — KLAGON.org" };
  return {
    title: `${board.name} — Community Forum | KLAGON.org`,
    description:
      board.description ??
      `Discuss ${board.name.toLowerCase()} with the Klagon community on klagon.org.`,
    alternates: { canonical: `/forum/${board.id}` },
  };
}

export default async function ForumBoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  if (!forumBoardById(boardId)) notFound();
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <BoardThreads boardId={boardId} />
      <Footer />
    </div>
  );
}