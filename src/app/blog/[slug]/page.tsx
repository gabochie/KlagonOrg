import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getAllPosts, getPostBySlug, getRelatedPosts, categorySlug } from "@/lib/blog";
import { formatBlogDate, isoToDateTime } from "@/lib/blogFormat";
import { getAuthorByName } from "@/lib/blogAuthors";
import { ReadAloud } from "@/components/read/ReadAloud";
import { ArticleReaderTracker } from "@/components/gamify/ArticleReaderTracker";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  const title = `${post.title} | KLAGON.org Blog`;
  return {
    title: post.title,
    description: post.description,
    keywords: [...post.tags, post.category, "KLAGON.org", "Ghana", "digital skills"],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description: post.description,
      url: `https://klagon.org/blog/${post.slug}`,
      siteName: "KLAGON.org",
      type: "article",
      locale: "en_GH",
      authors: [post.author],
      publishedTime: isoToDateTime(post.date),
      modifiedTime: post.updated ? isoToDateTime(post.updated) : undefined,
      section: post.category,
      tags: post.tags,
      images: [{ url: "/brand/og-banner.png", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: ["/brand/og-banner.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const related = getRelatedPosts(post ?? getAllPosts()[0]);

  if (!post) {
    return (
      <div className="w-full overflow-hidden">
        <Navbar />
        <main className="w-full">
          <section className="bg-light dark:bg-ink py-20 px-4 text-center">
            <div className="text-lg font-extrabold text-navy dark:text-white mb-2">Article not found</div>
            <p className="text-sm text-gray mb-5">The article you requested is unavailable.</p>
            <Link href="/blog" className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors">
              Back to Blog
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const published = isoToDateTime(post.date);
  const updated = post.updated ? isoToDateTime(post.updated) : null;
  const categoryPath = categorySlug(post.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `https://klagon.org/blog/${post.slug}#article`,
        mainEntityOfPage: `https://klagon.org/blog/${post.slug}`,
        headline: post.title,
        description: post.description,
        datePublished: published,
        dateModified: updated ?? published,
        inLanguage: "en-GH",
        author: {
          "@type": "Person",
          name: post.author,
          jobTitle: post.authorRole || undefined,
        },
        publisher: {
          "@type": "Organization",
          name: "KLAGON.org",
          logo: { "@type": "ImageObject", url: "https://klagon.org/brand/klagon-logo.png" },
        },
        image: "https://klagon.org/brand/og-banner.png",
        keywords: [...post.tags, post.category].join(", "),
        articleSection: post.category,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://klagon.org/blog/${post.slug}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://klagon.org/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://klagon.org/blog" },
          {
            "@type": "ListItem",
            position: 3,
            name: post.category,
            item: `https://klagon.org/blog/category/${categoryPath}`,
          },
        ],
      },
      ...(post.faq && post.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `https://klagon.org/blog/${post.slug}#faq`,
              mainEntity: post.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="w-full">
      {/* Article header */}
      <header className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60 mb-4">
            <Link href="/" className="hover:text-amber transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-amber transition-colors">Blog</Link>
            <span>/</span>
            <Link href={`/blog/category/${categoryPath}`} className="hover:text-amber transition-colors">
              {post.category}
            </Link>
          </div>
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber text-navy mb-4">
            {post.category}
          </span>
          <h1 className="text-[clamp(1.6rem,3.4vw,2.5rem)] font-extrabold text-white tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mb-5">{post.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50">
            <span className="font-semibold text-white">{post.icon} {post.author}</span>
            <span>·</span>
            <span>{post.authorRole}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50 mt-2">
            <span>Published {formatBlogDate(post.date)}</span>
            {updated && <span>· Updated {formatBlogDate(post.updated ?? post.date)}</span>}
            <span>· {post.readTime} min read</span>
          </div>
        </div>
      </header>

      <ArticleReaderTracker slug={post.slug} />
      {/* Body */}
      <article className="bg-light dark:bg-ink py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <ReadAloud targetId="article-body" />
          <div
            id="article-body"
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-border">
              <span className="text-xs font-semibold text-gray">Topics:</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-ink-2 border border-border text-[11px] text-gray"
                >
                  #{tag.toLowerCase().replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          )}

          {/* Author box */}
          <div className="mt-8 flex items-start gap-4 bg-white dark:bg-ink-2 border border-border rounded-xl p-5">
            <div className="w-11 h-11 rounded-full bg-pale dark:bg-ink-3 flex items-center justify-center text-xl shrink-0">
              {post.icon}
            </div>
            <div className="flex-1">
              <Link
                href={`/blog/author/${getAuthorByName(post.author)?.slug ?? "unknown"}`}
                className="text-sm font-extrabold text-navy dark:text-white hover:text-blue transition-colors"
              >
                {post.author}
              </Link>
              <div className="text-[11px] text-gray mb-1">{post.authorRole}</div>
              <p className="text-xs text-gray leading-relaxed">
                Written for KLAGON.org — where Ghana&apos;s youth learn real-world skills, free.{" "}
                <Link
                  href="/blog/authors"
                  className="text-blue underline"
                >
                  More from our authors
                </Link>
              </p>
            </div>
          </div>

          {/* Course CTA */}
          {post.course && (
            <div className="mt-6 bg-navy rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="text-sm font-extrabold text-white mb-0.5">
                  Put this into practice 🎓
                </div>
                <p className="text-xs text-white/60">
                  Continue with the free {post.course} course on the Learning Hub — short lessons,
                  progress tracking, XP and rewards.
                </p>
              </div>
              <Link
                href="/learning"
                className="shrink-0 px-4 py-2 rounded-lg bg-amber text-navy text-xs font-bold hover:bg-amber/90 transition-colors"
              >
                Start Learning Free
              </Link>
            </div>
          )}
        </div>
      </article>

      {/* Related */}
      <section className="bg-white dark:bg-ink-2 py-12 sm:py-14 px-4 sm:px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-extrabold text-navy dark:text-white mb-6">
            Keep reading
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group bg-light dark:bg-ink border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 dark:text-amber mb-2">
                  {p.category}
                </span>
                <h3 className="text-sm font-bold text-navy dark:text-white leading-snug mb-2 group-hover:text-blue transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <div className="text-[10px] text-gray">
                  {formatBlogDate(p.date)} · {p.readTime} min
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}