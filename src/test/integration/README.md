# Integration tests (RTL + router)

These tests render the **shipped** `App` route tree with mocked Supabase, auth, and subscription. They are **not** Playwright/browser E2E.

- Signed-in flows: import `./shipped-app-mocks` first (or rely on flow files that import it).
- Public `/auth` (signed-out): import `./public-app-mocks`. `/welcome` is not integration-tested (lazy Landing + motion).
- Use `renderShippedApp({ initialEntries: ['/journey'] })` from `render-shipped-app.tsx`. The harness stubs `BrowserRouter` so `MemoryRouter` owns routing (no nested-router error).

Flow files live under `flows/` and map to the pause-first plan §29.8 matrix (F1–F9, plus optional `landing-auth` for public routes).
