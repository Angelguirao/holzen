import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "supabase/functions/_shared/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["src/legacy/**", "src/test/legacy/**", "node_modules/**"],
    /**
     * Coverage configuration — designed for CI (`npm run test:ci`).
     *
     * We deliberately do NOT enforce a global coverage floor for the whole
     * codebase: most of the app is UI-glue with little behavioural logic
     * worth gating on, and a global threshold would either be permanently
     * red or so low it conveys nothing. Instead, we pin tight thresholds
     * to the **checkout-confirmation guard** surface — `CheckoutConfirmation`
     * and the suppression-window helper module — because those two files
     * encode subtle behavioural invariants (30-min window, mode-scoped
     * dedup, cross-tab broadcast, malformed-payload fallback, stale-guard
     * cleanup) where a regression silently re-fires `sub.refresh()` /
     * re-opens celebratory dialogs.
     *
     * The thresholds are intentionally just below the current measured
     * coverage from `CheckoutConfirmation.*.test.tsx` — high enough to catch regressions
     * (e.g. a new branch added without a matching test) but with a small
     * cushion so unrelated cosmetic edits don't trip CI.
     */
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      // Always include the guard files in the report, even if a test file
      // is renamed/removed and stops touching them — that way CI fails
      // loudly instead of silently dropping coverage.
      include: [
        "src/features/subscription/presentation/CheckoutConfirmation.tsx",
        "src/features/subscription/application/checkout-suppression-window.ts",
      ],
      // Per-file thresholds, scoped to the two guard files. `100` for any
      // metric is a hard ceiling we don't want to lock in — leave a small
      // margin so trivial edits don't fail CI.
      thresholds: {
        "src/features/subscription/presentation/CheckoutConfirmation.tsx": {
          // Measured baseline (Apr 2026): stmts 85.26 / branches 70.49 /
          // funcs 78.94 / lines 85.26. Floors set ~5pt below to absorb
          // benign edits without forcing a test for every cosmetic tweak.
          statements: 80,
          branches: 65,
          functions: 73,
          lines: 80,
        },
        "src/features/subscription/application/checkout-suppression-window.ts": {
          // Measured baseline (Apr 2026): stmts 90.10 / branches 65.16 /
          // funcs 77.77 / lines 90.10. Branch coverage is lower because
          // several `try/catch` arms exist purely as belt-and-braces
          // guards against `localStorage`/`sessionStorage` quota errors
          // that jsdom can't realistically trigger; we accept that and
          // floor branches at 60 instead of chasing unreachable arms.
          statements: 85,
          branches: 60,
          functions: 72,
          lines: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@holzen-pause-context": path.resolve(
        __dirname,
        "./supabase/functions/_shared/pause-context-suffix.ts",
      ),
    },
  },
});
