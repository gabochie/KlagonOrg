// Purge Next.js data/fetch cache so content-driven static pages always
// bake fresh Supabase data (no stale force-cache across builds).
const fs = require("fs");
const path = require("path");
const cacheDir = path.resolve(".next/cache");
fs.rmSync(cacheDir, { recursive: true, force: true });
console.log("Cleared .next/cache");