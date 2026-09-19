/**
 * Community slideshow strip — the pool of captioned images shown under the hero.
 *
 * PHOTO RULES (see public/images/README.md, consent + credits policy):
 *  - Every src is a real file we own (public/) — never a random CDN URL,
 *    never a broken hotlink, never a stock face presented as a resident.
 *  - Stock/AI imagery is allowed ONLY as atmospheric backdrops that are not
 *    captioned as Klagon people or testimonials. Real member faces require a
 *    signed release and get a real credit line here.
 *  - Uploads by members flow through posts.photos / stays.photos, not this file.
 */

export interface CommunityShot {
  /** Path under /public that actually exists. */
  src: string;
  /** Alt text — describe exactly what is shown, no embellishment. */
  alt: string;
  /** Short caption shown overlaid on the slide. */
  caption: string;
  /** Human-readable source + license for the README audit log. "KLAGON.org" = we own it. */
  credit: string;
}

/**
 * The strip pool. Only entries whose file exists on disk are rendered — build
 * keeps this honest. Join the KLAGON.org Telegram and send us a photo you took
 * of Klagon to add a slide; images here are replaced as consent is collected.
 *
 * Today: five owned brand assets (youth-hero, og-banner, plus the three brand-face
 * photos in /brand/community). Everything else is illustrated/owned — we do NOT
 * fake faces. As real, consented photos come in, append them here with a credit.
 */
export const COMMUNITY_SHOTS: CommunityShot[] = [
  {
    src: "/brand/youth-hero.png",
    alt: "Klagon youth in a skills workshop, seen from behind to protect identities",
    caption: "Skills today, livelihoods tomorrow — youth tracks in Klagon",
    credit: "KLAGON.org (owned)",
  },
  {
    src: "/brand/og-banner.png",
    alt: "The four doors of Klagon — learn, host, map, and trade",
    caption: "Four doors into one community: learn, visit, see, trade",
    credit: "KLAGON.org (owned)",
  },
  {
    src: "/brand/community/banner-2.jpg",
    alt: "A wide banner shot from the community of Klagon",
    caption: "One community, countless stories",
    credit: "KLAGON.org (owned)",
  },
  {
    src: "/brand/community/chief.jpg",
    alt: "A traditional leader of Klagon",
    caption: "Leadership rooted in the community",
    credit: "KLAGON.org (owned)",
  },
  {
    src: "/brand/community/lady.jpg",
    alt: "A woman of the Klagon community",
    caption: "A face of Klagon",
    credit: "KLAGON.org (owned)",
  },
];
