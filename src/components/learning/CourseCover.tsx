"use client";

// Course feature image. Resolution lives in src/lib/courseCover.ts so the card
// and the hero share one authored cover; a branded template always resolves, so
// there is never an empty cover. The category emoji is only the <img> failure
// fallback (offline, blocked request), never the default.
//
// Parents provide the sized wrapper (16:9); this fills it. Follows the repo's
// honest-<img> convention (CSP already allows supabase.co).
import { useState } from "react";
import { resolveCourseCover, type CoverableCourse, type CoverSize } from "@/lib/courseCover";

export function CourseCover({
  course,
  icon,
  title,
  size = 600,
  emojiClassName = "text-2xl",
}: {
  course: CoverableCourse;
  icon: string;
  title: string;
  size?: CoverSize;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={emojiClassName}>{icon}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveCourseCover(course, size)}
      alt={title}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
