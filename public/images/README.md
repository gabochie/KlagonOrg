# Community imagery policy

People make Klagon. But a face on this site is a promise — so every photo below is
**real, obtained with consent, and credited**. No stock faces presented as residents,
no random image CDNs, no broken links.

## The pool today
The slideshow on the homepage (`CommunityStrip`) reads from one registry:
`src/lib/community.ts` → `COMMUNITY_SHOTS`. Only files listed there render.

Current roster (all brand-owned, in this repo, photography we took or commissioned):

| src                       | caption                                            | credit                 |
| ------------------------- | -------------------------------------------------- | ---------------------- |
| `/brand/youth-hero.png`   | Klagon youth in a skills workshop                  | KLAGON.org field team  |
| `/brand/og-banner.png`    | The four doors of Klagon                           | KLAGON.org brand       |

Nothing here claims to show a named individual. Portraits of named people are only
added with a signed release (see the FAQ below) and are captioned with that consent.

## How to add a real photo
1. Drop the file in `public/brand/community/` (new) or reuse an existing brand image.
2. Add an entry to `COMMUNITY_SHOTS` in `src/lib/community.ts`:
   `{ src: "/brand/community/my-photo.png", caption: "…", credit: "Name + role (or KLAGON.org)" }`.
3. Log the credit here so attribution survives long after the person who added it leaves.

## Consent FAQ
- **Youth / children:** guardian signs a release; photo is never captioned with full
  name; removable on request at `hello@klagon.org`.
- **Adults:** participate by default but every photo carries a "request removal" path —
  we remove within 48 hours and note the correction publicly.
- **Never:** alter a photo's caption to claim something the photo doesn't show, or reuse
  a photo of one person for another's story.
- **Stock/stock-AI:** only as atmospheric backdrops that are *not* labeled as Klagon
  residents (e.g. a lagoon silhouette). Never as testimonials or member faces.
