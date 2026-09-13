import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getAllAuthors } from "@/lib/blogAuthors";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Authors — Meet the People Behind the KlagonOrg Blog",
  description:
    "Meet the mentors, coaches, and coordinators writing for the KlagonOrg blog — real people with first-hand experience in Klagon, Ghana.",
  alternates: { canonical: "/blog/authors" },
};

export default function AuthorsPage() {
  const authors = getAllAuthors();
  const posts = getAllPosts();

  return (
    <div className="w-full overflow-hidden">
      <Navbar />

      <section className="bg-navy py-14 sm:py-18 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link> / Authors
          </div>
          <h1 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Meet our authors
          </h1>
          <p className="text-white/60 text-sm max-w-xl mx-auto">
            Real people, real experience, right here in Klagon — the voices behind our guides.
          </p>
        </div>
      </section>

      <section className="bg-light dark:bg-ink py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {authors.map((a) => {
              const count = posts.filter((p) => p.author === a.name).length;
              return (
                <Link
                  key={a.slug}
                  href={`/blog/author/${a.slug}`}
                  className="group bg-white dark:bg-ink-2 border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-pale dark:bg-ink-3 flex items-center justify-center text-2xl shrink-0">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-extrabold text-navy dark:text-white group-hover:text-blue transition-colors">
                        {a.name}
                      </h2>
                      <div className="text-[11px] text-gray mb-2">{a.role}</div>
                      <p className="text-xs text-gray leading-relaxed mb-3 line-clamp-3">{a.bio}</p>
                      <span className="text-[11px] font-semibold text-blue">
                        {count} article{count === 1 ? "" : "s"} →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}