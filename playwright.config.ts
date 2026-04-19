import { defineConfig, devices } from "@playwright/test";

// Minimal Playwright config for Holzen. First step on the E2E path sketched
// in docs/backlog/e2e-browser-automation.md: a single smoke test against the
// Landing page (no auth, no Supabase-writing flows). Expand to pause / journal
// flows once the backend-for-tests strategy lands.

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  // One worker keeps log output readable for such a small suite.
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // `vite preview` serves the production build so the smoke test exercises
    // what ships, not the dev HMR layer.
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
