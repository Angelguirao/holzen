# Client tests (`src/test`)

Vitest discovers tests anywhere under `src/**/*.{test,spec}.{ts,tsx}` (see `vitest.config.ts`). This folder is **not** the default home for feature logic — it holds **integration flows**, **cross-cutting utilities**, and **shared fixtures**.

**Canonical placement rules:** [docs/fundamentals/client-src-layout.md](../../docs/fundamentals/client-src-layout.md) (Testing), [holzen-application-architecture.md](../../docs/fundamentals/holzen-application-architecture.md) §13.

## Where to put new tests

| Kind | Location | Example |
|------|----------|---------|
| Domain / application pure logic | Next to source under `src/features/<ctx>/` | `application/use-cases/session/gate-flags.test.ts` |
| Screen hooks / ritual orchestration | Next to hook under `src/screens/<route>/hooks/` | `use-pause-session-go-back.test.tsx` |
| App shell component | Next to component under `src/app/components/` | `BottomNav.test.tsx` |
| Transitional `src/lib` helper | Next to module | `home-subscription-gate.test.ts` |
| Shipped route flows (RTL + router) | `integration/flows/*.integration.test.tsx` | `home-start-pause.integration.test.tsx` |
| Shared edge pure helpers | Here or next to `supabase/functions/_shared/` | `sanitize.test.ts` |
| Undeployed / legacy surfaces | `legacy/` (excluded from default CI) | see `legacy/README.md` |

## This folder

| Path | Purpose |
|------|---------|
| `setup.ts` | Global Vitest setup (`jest-dom`, `matchMedia` stub) |
| `integration/` | Mocked `App` + Supabase; flow matrix F1–F9 — [integration/README.md](./integration/README.md) |
| `fixtures/` | Shared factories (`make-test-persisted-pause-session.ts`, …) |
| `shared/` | Vitest mirrors of Deno-only edge logic — [shared/README.md](./shared/README.md) |
| `legacy/` | Manual-only tests for stripped IA — [legacy/README.md](./legacy/README.md) |

**Edge pure helpers:** `supabase/functions/_shared/*.test.ts` (Vitest `include` in `vitest.config.ts`).

## Imports in tests

Active tests must use `@/features/<ctx>/public` (or `public-queries` / `public-rpc`), not deep feature layers or `@/lib/pause-*` shims — same as app code (`npm run check:feature-imports`).

## Commands

```bash
npm run test              # full suite (excludes src/legacy/** and src/test/legacy/**)
npx vitest run src/test/integration   # integration flows only
npx vitest run src/test/legacy        # legacy bucket (manual)
```
