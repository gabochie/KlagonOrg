import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize rendered HTML before it reaches dangerouslySetInnerHTML.
 * Markdown renderers (blog, lesson content) run marked first, then pass
 * the HTML through here: scripts, event handlers and javascript: URLs
 * are stripped; target=_blank links gain rel=noopener.
 */

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const target = node.getAttribute("target");
    if (target === "_blank") node.setAttribute("rel", "noopener");
  }
});

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Text content only: no executable tags, no frames, no inline styles.
    // (Video embeds go through validated JSX iframes, never markdown.)
    // `target` is allow-listed so the hook below can secure blank links.
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button", "object", "embed", "link", "meta"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
    ALLOW_DATA_ATTR: false,
  });
}
