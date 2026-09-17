import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest for KLAGON's pure kernels (healthScore, calculators, generators).
 *
 * Unit-only by design: tests import PURE src/lib modules (no React, no
 * Supabase, no next/fetch, no lucide). Intentionally NOT integrated into the
 * Next build/webpack graph and NOT part of `next build` — that export step
 * stays byte-stable and mojibake-free. `vitest` is a devDependency only.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/healthScore.ts", "src/lib/calculators/**/*.ts"],
      thresholds: {
        lines: 90,
        functions: 80,
        statements: 90,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
