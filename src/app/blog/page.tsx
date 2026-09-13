import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getAllPosts, getCategories, categorySlug } from "@/lib/blog";
import { formatBlogDate } from "@/lib/blogFormat";
import { getAuthorByName } from "@/lib/blogAuthors";

export const metadata: Metadata = {
  title: "Blog — Skills, Technology & Personal Growth for Ghana's Youth",
  description:
    "Practical guides on lifelong learning, digital transformation mastery, thinking skills, building visions, and making things happen — written for young people in Ghana.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "KlagonOrg Blog — Mastery of Change in the Digital Age",
    description:
      "Practical guides on lifelong learning, digital transformation, thinking skills, and building visions — free for Ghana's youth.",
    url: "https://klagon.org/blog",
    siteName: "KlagonOrg",
    type: "website",
    images: [{ url: "/brand/og-banner.png", width: 1200, height: 630, alt: "KlagonOrg Blog" }],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const categories = getCategories();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            The KlagonOrg Blog
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Mastery of Change in the Digital Age
          </h1>
          <p className="text-white/60 text-sm max-w-xl mx-auto">
            Practical guides on lifelong learning, digital transformation, thinking skills,
            building visions, and making things happen — free, and built for Ghana&apos;s youth.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white dark:bg-ink-2 border-b border-border py-5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/category/${cat.slug}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-pale dark:bg-ink-3 text-navy dark:text-white hover:bg-amber hover:text-navy transition-colors"
            >
              {cat.name} · {cat.count}
            </Link>
          ))}
          <Link
            href="/blog/authors"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-ink-2 border border-border text-gray hover:border-navy transition-colors"
          >
            Authors ✍️
          </Link>
        </div>
      </section>

      <section className="bg-light dark:bg-ink py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Featured post */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block bg-white dark:bg-ink-2 border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow mb-10"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-2/5 bg-pale dark:bg-ink-3 flex items-center justify-center py-12 text-6xl">
                  {featured.icon}
                </div>
                <div className="p-6 sm:p-8 sm:flex-1">
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 dark:text-amber mb-3">
                    Featured · {featured.category}
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-navy dark:text-white leading-tight mb-2 group-hover:text-blue transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-xs text-gray leading-relaxed mb-4">{featured.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray">
                    <Link
                      href={`/blog/author/${getAuthorByName(featured.author)?.slug ?? "unknown"}`}
                      className="font-semibold text-navy dark:text-white hover:text-blue transition-colors"
                    >
                      {featured.author}
                    </Link>
                    <span>·</span>
                    <span>{formatBlogDate(featured.date)}</span>
                    <span>·</span>
                    <span>{featured.readTime} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white dark:bg-ink-2 border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-24 bg-pale dark:bg-ink-3 flex items-center justify-center text-4xl">
                  {post.icon}
                </div>
                <div className="p-4 sm:p-5">
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 dark:text-amber mb-2">
                    {post.category}
                  </span>
                  <h3 className="text-sm font-bold text-navy dark:text-white leading-tight mb-1.5 group-hover:text-blue transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray leading-relaxed mb-3 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-gray pt-2 border-t border-border">
                    <Link
                      href={`/blog/author/${getAuthorByName(post.author)?.slug ?? "unknown"}`}
                      className="truncate max-w-[45%] hover:text-blue transition-colors"
                    >
                      {post.author}
                    </Link>
                    <span>
                      {formatBlogDate(post.date)} · {post.readTime} min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-navy rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="text-lg font-extrabold text-white mb-2">
              Reading is step one. Learning is step two.
            </h3>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-5">
              Turn these ideas into real skills with free, short courses on the KlagonOrg Learning
              Hub — automatic progress, rewards, and XP included.
            </p>
            <Link
              href="/learning"
              className="inline-block px-5 py-2.5 rounded-xl bg-amber text-navy text-sm font-bold hover:bg-amber/90 transition-colors"
            >
              Start a Free Course
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}