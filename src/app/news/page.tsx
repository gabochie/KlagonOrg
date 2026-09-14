"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NEWS_ARTICLES } from "@/lib/constants";
import { fetchPublicNews } from "@/lib/queries";
import type { NewsArticle } from "@/types";

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>(NEWS_ARTICLES);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    void (async () => {
      const live = await fetchPublicNews();
      if (live.length > 0) setArticles(live);
    })();
  }, []);

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const filtered =
    filter === "All" ? articles : articles.filter((a) => a.category === filter);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">News</div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Latest from KlagonOrg
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Updates, stories, and announcements from the KlagonOrg community.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => setFilter("All")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
                filter === "All"
                  ? "bg-navy text-white"
                  : "bg-white text-gray border border-border hover:border-navy"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
                  filter === cat
                    ? "bg-navy text-white"
                    : "bg-white text-gray border border-border hover:border-navy"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="h-28 bg-pale flex items-center justify-center text-3xl">
                  {article.image}
                </div>
                <div className="p-4 sm:p-5">
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 mb-2">
                    {article.category}
                  </span>
                  <h2 className="text-sm font-bold text-navy leading-tight mb-1.5">
                    {article.title}
                  </h2>
                  <p className="text-xs text-gray leading-relaxed mb-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray pt-2 border-t border-border">
                    <span>{article.author}</span>
                    <span>
                      {article.date} · {article.readTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
