export function formatBlogDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function isoToDateTime(iso: string): string {
  try {
    return new Date(iso).toISOString();
  } catch {
    return new Date().toISOString();
  }
}