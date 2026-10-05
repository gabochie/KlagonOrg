/**
 * Course cover resolution — one place that decides which image a course shows.
 *
 * Priority:
 *   1. An explicit cover. Authored covers are stored as a base path with no
 *      size suffix (e.g. "/brand/learning/SOE-VEN-01"); the size suffix is
 *      applied here so one field serves both the card and the hero. An
 *      uploaded cover is a full file URL and is used verbatim.
 *   2. A branded template chosen by school (college courses) or category
 *      (general hub courses). Templates are text-free backgrounds; the title
 *      is drawn in HTML over them.
 *
 * There is no emoji tier here: a template always resolves, so a course cover
 * can never come back empty. The emoji remains the <img> failure fallback in
 * CourseCover.
 */

export type CoverSize = 600 | 1200;

/** Site-wide social fallback, mirroring src/app/layout.tsx. */
const OG_FALLBACK = "/brand/og-banner.png";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export interface CoverableCourse {
  /** camelCase component field. Authored covers are base paths; uploads are full URLs. */
  coverUrl?: string | null;
  /** snake_case DB field (courses.cover_url / courses_public). Same semantics. */
  cover_url?: string | null;
  /** Content-layer field (catalogue.json). Same semantics as coverUrl. */
  cover?: string | null;
  school?: string | null;
  category?: string | null;
}

const FILE_EXT = /\.(webp|jpe?g|png|avif|gif)$/i;

const SCHOOL_TEMPLATE: Record<string, string> = {
  CCC: "ccc",
  SOT: "sot",
  SOE: "soe",
  SOD: "sod",
  SOA: "soa",
};

const CATEGORY_TEMPLATE: Record<string, string> = {
  "Future Skills": "sot",
  Technology: "sot",
  Finance: "soe",
  Entrepreneurship: "soe",
  Leadership: "ccc",
  Communication: "ccc",
  Career: "sod",
  Capstone: "generic",
};

/** The branded template key for a course, by school first, then category. */
export function templateKey(course: CoverableCourse): string {
  const school = course.school?.trim().toUpperCase();
  if (school && SCHOOL_TEMPLATE[school]) return SCHOOL_TEMPLATE[school];
  const category = course.category?.trim();
  if (category && CATEGORY_TEMPLATE[category]) return CATEGORY_TEMPLATE[category];
  return "generic";
}

/** The image src for a course at a given size. Always returns a path. */
export function resolveCourseCover(course: CoverableCourse, size: CoverSize = 600): string {
  const cover = (course.coverUrl ?? course.cover_url ?? course.cover)?.trim();
  if (cover) {
    if (FILE_EXT.test(cover)) return cover;
    return `${cover.replace(/\/$/, "")}-${size}.webp`;
  }
  return `/brand/learning/templates/${templateKey(course)}-${size}.webp`;
}

/**
 * The social image for a course, or null when the course has no authored cover.
 *
 * Deliberately does NOT fall back to a template: the templates are text-free
 * backgrounds, so a templated social card would be an unlabelled gradient next
 * to a link. Callers should fall back to the site OG banner instead.
 *
 * Returns a site-root-relative path. scripts/verify-course-covers.mjs asserts
 * the returned file actually exists under public/.
 */
export function resolveCourseOg(course: CoverableCourse): string | null {
  const cover = (course.coverUrl ?? course.cover_url ?? course.cover)?.trim();
  if (!cover) return null;
  if (FILE_EXT.test(cover)) return cover;
  return `${cover.replace(/\/$/, "")}-og.jpg`;
}

export const courseOgMeta = {
  fallback: OG_FALLBACK,
  width: OG_WIDTH,
  height: OG_HEIGHT,
} as const;