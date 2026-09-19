import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getCategories, getPostsByCategory, categorySlug } from "@/lib/blog";
import { formatBlogDate } from "@/lib/blogFormat";

interface Props {
  params: Promise<{ category: string }>;
}

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  "lifelong-learning": {
    title: "Lifelong Learning — Learn Any Skill, Any Age",
    description:
      "Guides on learning how to learn, study techniques, retention, and building daily learning habits that future-proof a career in the digital age.",
  },
  "digital-transformation": {
    title: "Digital Transformation Mastery — AI, Tools & The Future of Work",
    description:
      "How young people master digital transformation: AI for beginners, digital tools, data literacy, and leading change rather than being led by it.",
  },
  "thinking-skills": {
    title: "Thinking Skills — Critical Thinking for the AI Age",
    description:
      "Train the slow, deliberate thinking that AI can't replace: critical thinking, decision-making, avoiding bias, and keeping your mind sharp.",
  },
  "building-visions": {
    title: "Building Visions — Goals, Vision & Personal Direction",
    description:
      "Turn vague dreams into written, repeatable visions that survive hard days — goal setting, personal vision, and direction for young people.",
  },
  "making-things-happen": {
    title: "Making Things Happen — Execution, Momentum & Getting It Done",
    description:
      "Ideas are cheap; execution is everything. Learn the momentum system for turning plans into finished things: projects, businesses, and goals.",
  },
};

export async function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta =
    CATEGORY_META[category] ??
    CATEGORY_META["lifelong-learning"];
  return {
    title: `${meta.title} | KLAGON.org Blog`,
    description: meta.description,
    alternates: { canonical: `/blog/category/${category}` },
    openGraph: {
      title: `${meta.title} | KLAGON.org Blog`,
      description: meta.description,
      url: `https://klagon.org/blog/category/${category}`,
      siteName: "KLAGON.org",
      type: "website",
      locale: "en_GH",
      images: [{ url: "/brand/og-banner.png", width: 1200, height: 630, alt: meta.title }],
    },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategories().find((c) => c.slug === category);
  const posts = cat ? getPostsByCategory(cat.name) : [];
  const meta = CATEGORY_META[category];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://klagon.org/blog/category/${category}#collection`,
        name: meta?.title.split(" — ")[0],
        description: meta?.description,
        url: `https://klagon.org/blog/category/${category}`,
        isPartOf: { "@id": "https://klagon.org/blog#collection" },
      },
      {
        "@type": "ItemList",
        "@id": `https://klagon.org/blog/category/${category}#list`,
        name: "Articles in this topic",
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          url: `https://klagon.org/blog/${p.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://klagon.org/blog/category/${category}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://klagon.org/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://klagon.org/blog" },
          {
            "@type": "ListItem",
            position: 3,
            name: meta?.title.split(" — ")[0] ?? category,
            item: `https://klagon.org/blog/category/${category}`,
          },
        ],
      },
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

      <section className="bg-navy py-14 sm:py-18 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link> / Topic
          </div>
          <h1 className="text-[clamp(1.8rem,3.6vw,2.8rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            {meta?.title.split(" — ")[0]}
          </h1>
          <p className="text-white/60 text-sm max-w-xl mx-auto">{meta?.description}</p>
        </div>
      </section>

      <section className="bg-light dark:bg-ink py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-sm text-gray mb-5">No articles in this topic yet — check back soon.</p>
              <Link href="/blog" className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors">
                Back to Blog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
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
                    <h2 className="text-sm font-bold text-navy dark:text-white leading-tight mb-1.5 group-hover:text-blue transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-xs text-gray leading-relaxed mb-3 line-clamp-2">{post.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray pt-2 border-t border-border">
                      <span className="truncate max-w-[45%]">{post.author}</span>
                      <span>
                        {formatBlogDate(post.date)} · {post.readTime} min
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-2">
            {getCategories()
              .filter((c) => c.slug !== category)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/blog/category/${c.slug}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-ink-2 border border-border text-gray hover:border-navy transition-colors"
                >
                  {c.name}
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