# E2E / browser automation for full product flows

**Status:** in progress — **scaffolding + one landing-page smoke test** landed (Playwright + `e2e/landing.smoke.spec.ts` + CI job). Pause / journal / auth flows still deferred until the backend-for-tests strategy below is in place.

---

## Why it is not done yet (not “we shouldn’t”)

Holzen **can** add Playwright/Cypress/Vitest+RTL; nothing technical forbids it. It stayed backlog mainly because:

1. **Other assurance first** — HTTP review ([Bruno](../../bruno/README.md)), phased security/pipeline [reviews](../reviews/), and Vitest unit tests gave faster wins for the effort so far.
2. **Environment cost** — Real E2E needs a **repeatable app + backend**: signed-in user, Supabase (local or hosted), env vars in CI. That is more moving parts than `npm run test` alone.
3. **Flows that call AI** — A full **pause** journey hits **`holzen-reflect`** and **`companion-orchestrate`** (cost, rate limits, variability). Stable E2E usually needs **test doubles**, a **dedicated project**, or **narrow smoke tests** (e.g. “lands on `/pause` after login”) before asserting full copy.
4. **Flake and maintenance** — Browser E2E is valuable but **slower and more brittle** than API tests; it pays off once you invest in selectors, retries, and CI hygiene.

When this is prioritized, start with **one smoke path** (auth shell + route) and add pause/journal after env strategy is clear.

---

## UI / journeys (what this ticket is for)

For **full product flows** — click-through **pause**, **journal**, **settings**, auth shells, layout — you still want **Playwright**, **Cypress**, or **Vitest + React Testing Library**. Those exercise **React Router**, **hooks**, **TanStack Query**, and **client-only state**.

**Bruno** (and Postman) are for **HTTP / Edge Function API review**, not browser automation. They do not log in through the SPA, drive the pause UI, or assert what the user sees.

| Layer | Tooling | Proves |
|-------|---------|--------|
| **API / contracts** | Bruno, Postman, `curl` | Status codes, bodies, auth headers, edge behavior |
| **UI / journeys** | Playwright, Cypress, Vitest+RTL | Routes, components, accessibility of real flows |

See [bruno/SCOPE.md](../../bruno/SCOPE.md) and [http-review-playbooks.md](../fundamentals/http-review-playbooks.md).

---

## Goal

Cover flows that **Bruno cannot** exercise end-to-end: navigation, gated routes, and in-app state transitions.

## Direction

- **Playwright** or **Cypress** for cross-browser E2E against `npm run dev` / preview builds, **or**
- **Vitest + React Testing Library** for component/route integration tests where full browser is unnecessary.

Bruno remains for **HTTP / Edge Function API review** only.

## Links

- [http-review-playbooks.md](../fundamentals/http-review-playbooks.md)
- [docs/README.md](../README.md) — canonical row for **UI / journeys** vs HTTP review
