import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("strips scripts, event handlers and javascript: URLs", () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).not.toContain("<script>");
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("forbids frames, forms and inline styles", () => {
    expect(sanitizeHtml('<iframe src="https://evil.example"></iframe>')).not.toContain("<iframe");
    expect(sanitizeHtml('<p style="color:red">x</p>')).not.toContain("style=");
  });

  it("keeps formatting, links and tables", () => {
    const out = sanitizeHtml(
      '<h2 class="blog-h2">T</h2><p class="blog-p">B <strong class="blog-strong">b</strong></p><table class="blog-table"><tr><td>c</td></tr></table><a class="blog-link" href="https://klagon.org">k</a>'
    );
    expect(out).toContain('class="blog-h2"');
    expect(out).toContain("<table");
    expect(out).toContain('href="https://klagon.org"');
  });

  it("adds rel=noopener to blank-target links", () => {
    expect(sanitizeHtml('<a href="https://klagon.org" target="_blank">k</a>')).toContain(
      'rel="noopener"'
    );
  });
});
