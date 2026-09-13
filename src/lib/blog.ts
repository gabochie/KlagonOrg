import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export interface BlogFaqItem {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  readTime: number;
  icon: string;
  course?: string;
  faq?: BlogFaqItem[];
  content: string;
  contentHtml: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

const CATEGORY_SLUGS: Record<string, string> = {
  "Lifelong Learning": "lifelong-learning",
  "Digital Transformation Mastery": "digital-transformation",
  "Thinking Skills": "thinking-skills",
  "Building Visions": "building-visions",
  "Making Things Happen": "making-things-happen",
};

export function categorySlug(name: string): string {
  return CATEGORY_SLUGS[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

marked.setOptions({
  gfm: true,
  breaks: false,
});

function renderHtml(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string;
  return raw
    .replace(/<h2 /g, '<h2 class="blog-h2" ')
    .replace(/<h3 /g, '<h3 class="blog-h3" ')
    .replace(/<p>/g, '<p class="blog-p">')
    .replace(/<li>/g, '<li class="blog-li">')
    .replace(/<ul>/g, '<ul class="blog-ul">')
    .replace(/<ol>/g, '<ol class="blog-ol">')
    .replace(/<a /g, '<a class="blog-link" ')
    .replace(/<blockquote>/g, '<blockquote class="blog-quote">')
    .replace(/<table>/g, '<table class="blog-table">')
    .replace(/<strong>/g, "<strong class=\"blog-strong\">");
}

function readMarkdownFile(filePath: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug: data.slug || path.basename(filePath, ".md"),
    title: data.title || "Untitled",
    description: data.description || "",
    date: data.date || "",
    updated: data.updated,
    category: data.category || "Lifelong Learning",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: data.author || "KlagonOrg Team",
    authorRole: data.authorRole || "",
    readTime: Number(data.readTime || 3),
    icon: data.icon || "📄",
    course: data.course,
    faq: Array.isArray(data.faq)
      ? data.faq
          .map((f) => ({ q: String(f?.q ?? ""), a: String(f?.a ?? "") }))
          .filter((f) => f.q && f.a)
      : undefined,
    content,
    contentHtml: renderHtml(content),
  };
}

export function getAllPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(BLOG_DIR)) return [];
    const files = fs
      .readdirSync(BLOG_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => b.localeCompare(a));
    return files
      .map((f) => {
        try {
          return readMarkdownFile(path.join(BLOG_DIR, f));
        } catch {
          return null;
        }
      })
      .filter((p): p is BlogPost => !!p && !!p.date)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch {
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export function getCategories(): BlogCategory[] {
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({
    name,
    slug: categorySlug(name),
    count,
  }));
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const posts = getAllPosts().filter((p) => p.slug !== post.slug);
  const scored = posts
    .map((p) => {
      let score = p.category === post.category ? 2 : 0;
      const sharedTags = p.tags.filter((t) => post.tags.includes(t)).length;
      score += sharedTags;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.post);
}

export function profilePostsForAuthor(author: string): BlogPost[] {
  return getAllPosts().filter((p) => p.author === author);
}