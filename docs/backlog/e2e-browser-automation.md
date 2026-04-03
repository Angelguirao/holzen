# E2E / browser automation for full product flows

**Status:** backlog — not started.

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
