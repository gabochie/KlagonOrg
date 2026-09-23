# KlagonOrg Blog — Content Authoring Guide

Publishing an article = adding ONE markdown file to `content/blog/`, then building + deploying.
Every article you add appears automatically in: `/blog`, its category page, the author page, the **sitemap**, and the **RSS feed**.

---

## 1. Create the file

Add a new file: `content/blog/your-article-slug.md`

Use all lowercase, hyphens between words. Keep it human-readable (`how-to-save-money.md`).

## 2. Copy the frontmatter (this exact structure)

```markdown
---
title: "Your SEO-friendly Title Here"
slug: your-article-slug
description: "One or two sentences for search results and cards. 150–160 characters is ideal."
date: "2026-10-18"
updated: "2026-10-18"
category: "Lifelong Learning"
tags: ["tag one", "tag two", "tag three"]
author: "Kweku Asante"
authorRole: "Software Engineer & Volunteer Mentor, KlagonOrg"
readTime: 6
icon: "📘"
course: "Introduction to AI"
---
```

### Field rules

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | Write for the reader & search: include the main topic + a benefit. e.g. "How to Save Money on Mobile Money" |
| `slug` | ✅ | Must match the filename (minus `.md`) |
| `description` | ✅ | The single most important SEO field — put the key phrase and a promise |
| `date` | ✅ | YYYY-MM-DD |
| `updated` | optional | Add when you revise; boosts freshness signals |
| `category` | ✅ | Must be one of the six: `Lifelong Learning`, `Digital Transformation Mastery`, `Thinking Skills`, `Building Visions`, `Making Things Happen`, `Discover Klagon` |
| `tags` | ✅ | 2–4 tags, lowercase, no symbols |
| `author` | ✅ | Must be an approved name in `src/lib/blogAuthors.ts` (see below) |
| `authorRole` | ✅ | Short authority line under the name |
| `readTime` | ✅ | Estimate in whole minutes |
| `icon` | ✅ | One emoji |
| `image` | optional | Featured image path (e.g. `/brand/discover/10a_branded.jpg`). Renders as the card thumbnail, post hero, and the OG/Twitter/JSON-LD image. Omit for the default branding. |
| `status` | optional | Set to `scheduled` to hide the post until its `date`. See *Scheduling* below. |
| `course` | optional | Add to show a "Start Learning Free" CTA box linking to the Learning Hub |
| `faq` | optional | 3–4 Q&A pairs; renders a FAQPage JSON-LD block (AI/LLMO rich-result eligible) |

### Optional FAQ block (add to high-intent articles)

Add `faq` to a top-intent article with strong search-snippet potential (e.g. exams, scams, CV, WhatsApp, AI). It renders as an FAQPage schema block for Google + AI engines.

```markdown
faq:
  - q: "How long should I study for WASSCE or BECE?"
    a: "Start 6 weeks before the paper. The plan in this guide covers week-by-week revision."
  - q: "What is the fastest way to improve exam scores?"
    a: "Past questions. Drilling past questions teaches you how marks are awarded."
```

Rules: 3–4 pairs, one plain sentence each, answers must match the article body, no keyword-stuffed questions.

### Approved authors (edit `src/lib/blogAuthors.ts` to add more)

```
Kweku Asante · Emmanuel Kumi · Ama Kofi · Serwaa Boateng · Mary Acheampong
The Discover Klagon Guides (community-narrated tour team)
```

## 3. Write the body (Markdown)

**Supported formatting:** headings (`##` `###`), paragraphs, bold/italic, lists, quotes, tables, links, code.

**Structure every article for readability + SEO:**

```
# Title (use an H1 — same as your `title`)
Intro paragraph (state the problem and the promise — front-load the keyword)
## H2 section
paragraphs…
### H3 subsection (optional)
...
## Conclusion (clear takeaway)
```

## 4. Writing rules that keep us SEO-competitive

These follow Google's Helpful Content & scaled-content policy — original value wins; filler loses.

1. **Write for a person first.** Real experiences, concrete Ghanaian examples, actionable steps. No generic "5 keys to success" fluff.
2. **Include a real method or template.** People save articles that give them a usable system (a fill-in table, a checklist, a 3-step ladder).
3. **One topic per article.** Depth beats breadth. If it deserves two posts, write two.
4. **Answer the search intent.** Ask "what would someone searching this title actually want?" — then deliver exactly that in the first 150 words.
5. **Front-load the value.** Lead with the honest answer early; don't hide it behind 400 words of throat-clearing.
6. **Use natural headings.** Your H2s should read like the sub-questions someone would ask.
7. **Link internally.** Mention the Learning Hub (`/learning`) and relevant courses naturally in one CTA box (via `course:` field) and one inline link.
8. **Be accurate and dated.** Update `updated:` whenever you revise. Fresh, accurate beats evergreen-and-stale.
9. **Originality, always.** Do not mass-produce near-duplicate pages. Every article must be meaningfully different.
10. **No keyword stuffing.** Use your key phrase naturally; write sentences a human would want to read.

## 5. Scheduling (publish on a future date)

The `publish` GitHub Action rebuilds and redeploys every day at 06:00 (Ghana/UTC). A post with `status: scheduled` stays **hidden** (no page, no sitemap, no RSS entry) until its `date`, then surfaces automatically on the next scheduled deploy — no timing tricks needed.

```markdown
title: "..."
date: "2026-10-01"          # the day it goes live
status: scheduled           # hide until that day
```

Rules:
- Posts **without** `status` are always visible (this keeps the existing pre-dated backlog live).
- A scheduled post with a missing/malformed future date stays hidden — give it a real `YYYY-MM-DD`.
- To publish immediately, drop `status: scheduled` (and set `date` to today).

## 6. Publish

```bash
npm run build   # regenerates RSS + pre-renders all pages
npx wrangler pages deploy out --project-name klagon-org --branch main
git add -A && git commit -m "Blog: <article title>" && git push
```

## 6. Double-check before building

- [ ] Filename == `slug`
- [ ] `category` is one of the five pillars
- [ ] `author` exists in `blogAuthors.ts`
- [ ] `description` present, ~150 characters
- [ ] Article has at least 3 `##` sections + a conclusion
- [ ] Build runs green, then redeploy

## How it all composes (no code changes needed)

| Asset | Auto-updates |
|---|---|
| `/blog` grid + featured card | ✅ |
| Category page (`/blog/category/*`) | ✅ |
| Author page (`/blog/author/*`) | ✅ |
| `sitemap.xml` (post + lastModified) | ✅ |
| `rss.xml` (top 20 newest) | ✅ |
| Related articles ("Keep reading") | ✅ by tags/category |