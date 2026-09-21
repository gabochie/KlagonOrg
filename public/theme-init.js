// KLAGON theme bootstrap — runs before paint to avoid a light-mode flash.
// Kept as an external file (instead of an inline script) so the site's
// Content-Security-Policy can forbid inline scripts entirely.
(function () {
  try {
    var t = localStorage.getItem("klagon-theme");
    if (!t) {
      t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    /* storage unavailable — default light theme */
  }
})();
