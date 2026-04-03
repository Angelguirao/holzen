# E2E / browser automation for full product flows

**Status:** backlog — not started.

## Goal

Cover **full product flows** (e.g. click-through pause, journal, settings) that **Bruno cannot** exercise: React Router, layout, TanStack Query, and client-only state.

## Direction

- **Playwright** or **Cypress** for cross-browser E2E against `npm run dev` / preview builds, **or**
- **Vitest + React Testing Library** for component/route integration tests where full browser is unnecessary.

Bruno remains for **HTTP / Edge Function API review** only; see [bruno/SCOPE.md](../../bruno/SCOPE.md).

## Links

- [http-review-playbooks.md](../fundamentals/http-review-playbooks.md)
