"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareQuote, Loader2 } from "lucide-react";
import { fetchBoards, type ForumBoard } from "@/lib/forum";
import { boardIcon } from "@/lib/forumBoards";
import { Card, CardTitle, CardSub } from "@/components/ui";

export function ForumSection() {
  const [boards, setBoards] = useState<ForumBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const b = await fetchBoards();
      if (!active) return;
      setBoards(b);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Community Forum
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Talk, ask, share
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Open discussion boards for Klagon — Ask questions, share updates, discuss culture
            and give feedback. Anyone can read; members start the conversation.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading boards…</span>
            </div>
) : boards.length === 0 ? (
            <p className="text-center text-sm text-gray py-10">
              Boards are coming soon — check back shortly.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {boards.map((b) => (
                <Link key={b.id} href={`/forum/${b.id}`} className="group block">
                  <Card className="h-full hover:border-amber transition-colors">
                    <div className="flex items-start gap-3 p-5">
                      <div className="text-2xl leading-none" aria-hidden>
                        {boardIcon(b.id)}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-navy group-hover:text-blue transition-colors flex items-center gap-2">
                          {b.name}
                          <span className="text-xs font-medium text-gray flex items-center gap-1">
                            <MessageSquareQuote className="h-3 w-3" />
                            {b.threadCount}
                          </span>
                        </CardTitle>
                        <CardSub className="text-gray mt-1">
                          {b.description ?? "Join the conversation."}
                        </CardSub>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}