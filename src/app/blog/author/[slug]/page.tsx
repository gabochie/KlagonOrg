import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getAllAuthors, getAuthorBySlug } from "@/lib/blogAuthors";
import { getAllPosts } from "@/lib/blog";
import { formatBlogDate } from "@/lib/blogFormat";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: "Author not found" };
  return {
    title: `${author.name} — Author & ${author.role}`,
    description: author.bio,
    alternates: { canonical: `/blog/author/${author.slug}` },
    openGraph: {
      title: `${author.name} — KLAGON.org Blog Author`,
      description: author.bio,
      url: `https://klagon.org/blog/author/${author.slug}`,
      siteName: "KLAGON.org",
      type: "profile",
      images: [{ url: "/brand/og-banner.png", width: 1200, height: 630, alt: author.name }],
    },
  };
}

const AUTHOR_JSONLD = "https://schema.org";

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) {
    return (
      <div className="w-full overflow-hidden">
        <Navbar />
        <main className="w-full">
          <section className="bg-light dark:bg-ink py-20 px-4 text-center">
            <div className="text-lg font-extrabold text-navy dark:text-white mb-2">Author not found</div>
            <Link href="/blog/authors" className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors">
              Back to Authors
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const posts = getAllPosts().filter((p) => p.author === author.name);

  const jsonLd = {
    "@context": AUTHOR_JSONLD,
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role,
      description: author.bio,
      worksFor: { "@type": "Organization", name: "KLAGON.org" },
    },
  };

  return (
    <div className="w-full overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main className="w-full">
        <section className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-5xl shrink-0">
              {author.icon}
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">
                <Link href="/blog" className="hover:text-white transition-colors">Blog</Link> · Author
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-1">
                {author.name}
              </h1>
              <p className="text-white/60 text-sm mb-3">{author.role}</p>
              <p className="text-white/70 text-sm max-w-2xl leading-relaxed">{author.bio}</p>
            </div>
          </div>
        </section>

        <section className="bg-light dark:bg-ink py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-extrabold text-navy dark:text-white mb-6">
              Articles by {author.name} ({posts.length})
            </h2>
            {posts.length === 0 ? (
              <p className="text-sm text-gray">No articles published yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group bg-white dark:bg-ink-2 border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-24 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-24 bg-pale dark:bg-ink-3 flex items-center justify-center text-4xl">
                        {post.icon}
                      </div>
                    )}
                    <div className="p-4 sm:p-5">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 dark:text-amber mb-2">
                        {post.category}
                      </span>
                      <h3 className="text-sm font-bold text-navy dark:text-white leading-tight mb-1.5 group-hover:text-blue transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray leading-relaxed mb-3 line-clamp-2">{post.description}</p>
                      <div className="text-[10px] text-gray">
                        {formatBlogDate(post.date)} · {post.readTime} min read
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}