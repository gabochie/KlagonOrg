// Forum boards that ship with every build (mirrors the seed in
// supabase/migrations/20260922000000_forum.sql). No "use client" —
// safe to import from server pages for generateStaticParams/metadata.

export interface ForumBoardSeed {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export const FORUM_BOARDS: ForumBoardSeed[] = [
  { id: "general", name: "General Talk", description: "Open conversation about life in Klagon and beyond.", icon: "🗨️" },
  { id: "ask", name: "Ask & Help", description: "Questions, recommendations and community advice.", icon: "🤝" },
  { id: "culture", name: "Culture & Chieftaincy", description: "Heritage, arts, festivals and chieftaincy matters.", icon: "🥁" },
  { id: "market", name: "Marketplace Talk", description: "Buying, selling and experiences with local vendors.", icon: "🛒" },
  { id: "suggest", name: "Site Feedback", description: "Ideas and feedback for klagon.org itself.", icon: "💡" },
];

export function forumBoardById(id: string): ForumBoardSeed | undefined {
  return FORUM_BOARDS.find((b) => b.id === id);
}

// Board rows in the DB keep icon = NULL (plain ASCII for SQL editors);
// the app renders the icon per board id instead.
export function boardIcon(id: string, fallback = "🗨️"): string {
  const icons: Record<string, string> = {
    general: "🗨️",
    ask: "🤝",
    culture: "🥁",
    market: "🛒",
    suggest: "💡",
  };
  return icons[id] ?? fallback;
}