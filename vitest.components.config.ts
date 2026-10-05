import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Component tests: the one deliberate exception to the unit-only rule that
 * vitest.config.ts documents.
 *
 * That config stays pure `src/lib` kernels with a node environment so nothing
 * browser-shaped can reach the `next build` graph and the static export stays
 * byte-stable. These tests need a real renderer because what needs guarding is
 * React state *settling over time*, not a pure function: AuthProvider used to
 * leave `loading` true forever when the session lookup failed, and no
 * pure-module test could have caught that class of bug.
 *
 * Kept in its own config rather than a `projects` entry so `npm test` still
 * means "unit only" and the fast CI lane is unchanged. Run with
 * `npm run test:components`.
 */
export default defineConfig({
  // tsconfig.json sets jsx: "preserve" for Next's compiler, which leaves JSX
  // untransformed and fails vite's import analysis. The plugin transforms it.
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
    globals: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});