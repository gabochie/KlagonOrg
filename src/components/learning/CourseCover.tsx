// Course feature image with the site's pastel+emoji block as the placeholder.
// Parents provide the sized wrapper (with background color); this fills it:
// a real cover photo when cover_url exists, otherwise the category emoji.
// Follows the repo's honest-<img> convention (CSP already allows supabase.co).
export function CourseCover({
  coverUrl,
  icon,
  title,
  emojiClassName = "text-2xl",
}: {
  coverUrl: string | null | undefined;
  icon: string;
  title: string;
  emojiClassName?: string;
}) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
    );
  }
  return <span className={emojiClassName}>{icon}</span>;
}
