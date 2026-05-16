# Integration tests (RTL + router)

These tests render the **shipped** `App` route tree with mocked Supabase, auth, and subscription. They are **not** Playwright/browser E2E.

- Import `./shipped-app-mocks` (or rely on flow files that import it first).
- Use `renderShippedApp({ initialEntries: ['/journey'] })` from `render-shipped-app.tsx`.

Flow files live under `flows/` and map to the pause-first plan §29.8 matrix (F1–F9).
