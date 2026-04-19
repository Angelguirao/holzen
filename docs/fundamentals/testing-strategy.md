# Testing strategy

This document is the **canonical description** of how Holzen tests the app: what layers of the test pyramid we invest in, what we deliberately skip, and where tests live. It complements:

- **[`AGENTS.md`](../../AGENTS.md)** — commands (`npm run test`, `npm run lint`, `npm run check:edge`) and the ESLint baseline note (pre-existing `any`/warnings; don't bulk-clean as part of a small task).
- **[`backlog/e2e-browser-automation.md`](../backlog/e2e-browser-automation.md)** — why full-browser E2E (Playwright/Cypress) is still backlog and what needs to be in place before it lands.
- **[`fundamentals/http-review-playbooks.md`](http-review-playbooks.md)** — Bruno / Postman review of edge function HTTP contracts (a different layer; see table below).
- **[`fundamentals/navigating-the-codebase.md`](navigating-the-codebase.md)** — where the code under test lives (`src/`, `src/lib/`, `supabase/functions/_shared/`).

---

## Shape: test pyramid, unit-heavy base

We follow a **classic test pyramid**, weighted toward the base:

```
              ┌──────────────┐
              │    E2E (0)   │   ← deferred (backlog/e2e-browser-automation.md)
              └──────────────┘
           ┌────────────────────┐
           │ Integration (~few) │   ← React hook + component tests where
           │                    │     behavior is not reducible to pure fns
           └────────────────────┘
      ┌──────────────────────────────┐
      │ Contract tests at boundaries │   ← router state, sanitizers, parsers
      └──────────────────────────────┘
 ┌────────────────────────────────────────┐
 │        Unit tests of pure logic        │   ← bulk of the suite
 └────────────────────────────────────────┘
```

**Why unit-heavy.** Holzen's risk sits in **pure logic that's easy to mis-change in a hurry**: BTC severity bucketing, pause context suffixes, duplicate detection, URL attribution, phase gating, skill detection, session-intent classification. That logic is the natural unit-test sweet spot — no mocks, no DOM, no Supabase.

**Why contract tests at the boundary.** The browser-router state (`history.state`) is `unknown`. The router-state parsers (`src/lib/router-location-state.ts`) are a **trust boundary**: untrusted input in, typed shape out, with sensible defaults on bad input. Those parsers get dedicated "garbage in → safe defaults out" contract tests so a downstream page can rely on the shape without defensive checks.

**Why deferred E2E.** Full browser flows need a repeatable backend (local Supabase + env + signed-in user), and pause flows call AI endpoints (cost + flake). Until that environment story lands, the expected value of E2E is lower than more unit/contract coverage. See [`backlog/e2e-browser-automation.md`](../backlog/e2e-browser-automation.md).

---

## Where tests live

| Test kind | Location | Runner |
|-----------|---------|--------|
| All frontend + shared edge tests | `src/test/*.{test,spec}.{ts,tsx}` | **Vitest + jsdom** |
| Edge function shared helpers (Deno code) | Imported from `src/test/` via relative path: `../../supabase/functions/_shared/<module>` | **Vitest** (compiles the TS directly) |
| Bruno HTTP collections (edge API review) | `bruno/` | **Bruno** CLI — separate track, not part of `npm run test` |
| `deno check` on edge `index.ts` | `supabase/functions/*/index.ts` | `npm run check:edge` (skips if Deno missing) |

**`npm run test`** is the canonical command; CI runs `npx vitest run`. Vitest resolves:

- `@/…` → `src/` (matches Vite's alias)
- `@holzen-pause-context` → `supabase/functions/_shared/pause-context-suffix.ts`

See `vitest.config.ts`. Anything else in `supabase/functions/_shared/` is imported via **relative path** from `src/test/` (e.g. `../../supabase/functions/_shared/session-intent`) — Vitest happily crosses that boundary because it's plain TypeScript. Edge code that touches `Deno.env.get` is tested by stubbing `globalThis.Deno` in a `beforeEach` / `afterEach` (see `src/test/phase-config.test.ts`).

---

## What we test

### Base layer: pure logic (most of the suite)

Anything in `src/lib/` or `supabase/functions/_shared/` whose signature is roughly `(data) => data` gets a unit test. Current coverage areas:

- **Pause scoring / severity** — `btc-move-severity`, `volatility-thresholds`, `intervention-selector` helpers (`parseDirection`, `bucketSeverity`).
- **Pause context** — `pause-context-suffix`, `pause-context-from-btc`.
- **Companion data** — `companion-url`, `companion-types`, `companion-fullview-primitives`.
- **Content + cache** — `duplicate-detection`, `content-dedup-batch`, `related-biases-dedupe`, `feed-ingest-filter`, `library-item-url`, `fallbacks`.
- **Edge shared helpers** — `circuit-breaker-math`, `coingecko-util`, `perplexity-citations`, `quality-gate`, `sanitize`, `app-config-edge`, `signup-gate`, `grounding-enrichment-util`, `history-util`, `past-reflection-util`, `phase-config`, `recent-signal-urls`, `source-validation`.
- **Classifiers** — `skill-detection` (what skill bucket a reflection demonstrates), `session-intent` (which theme drives the pause).

**Target:** every pure module in `src/lib/` and `supabase/functions/_shared/` should have a `*.test.ts` file when its logic is non-trivial (i.e. more than a one-liner). Add a test when you add the module, not later.

### Boundary: contract tests

A **contract test** pins the behavior a module's callers rely on, independent of how it's implemented. We use them where the input is **untrusted** and the output is **consumed without further validation**:

- `router-location-state.test.ts` — `parsePauseSessionLocationState`, `parseGroundLocationState`, `parseProfileLocationState` take `unknown` from `history.state` and return a typed, validated shape. The tests pin:
  - non-objects → all-empty defaults
  - string coercion + trim
  - severity / tab / companion-prefs whitelists
  - shape validation (e.g. CompanionData requires the three nullable strings; article requires snippet + url)
- `sanitize.test.ts` — control-char stripping invariants (edge functions trust the output).

If you add another `parse*` / `sanitize*` / `validate*` at a trust boundary, **add a contract test alongside it**.

### Middle: React hooks / components

We write integration tests for React code **only** when the behavior is not reducible to a pure helper. Current examples:

- `use-staggered-reveal.test.tsx` — timing-sensitive hook behavior.

**Rule of thumb:** if a test needs to mock Supabase, TanStack Query, and the router just to assert "this button calls that function," the logic probably wants to be extracted into `src/lib/` first (see [`refactoring-strategy.md`](refactoring-strategy.md) §2). Test the extracted helper. Leave the thin component untested.

### Top: end-to-end

**None today.** Tracked in [`backlog/e2e-browser-automation.md`](../backlog/e2e-browser-automation.md). When it lands, start with one smoke path (auth shell → `/pause`) before asserting full pause copy.

---

## What we deliberately don't test

- **shadcn / Radix UI wrappers** (`src/components/ui/*`). They are thin re-exports; testing them tests the library, not our code.
- **Pages end-to-end without a browser.** Mocking every Supabase call and every hook to render `PauseSession.tsx` in jsdom produces fragile tests that break on refactors without catching real bugs. Those flows belong in future E2E.
- **Edge function `index.ts` entrypoints.** They are thin HTTP glue around shared helpers. The helpers are unit-tested; the HTTP layer is reviewed via **Bruno** (see [`http-review-playbooks.md`](http-review-playbooks.md)).
- **Supabase RLS / DB behavior.** Covered by migration review and the phased security reviews under [`reviews/`](../reviews/), not by JS unit tests.
- **Bulk lint cleanup as part of test work.** Per [`AGENTS.md`](../../AGENTS.md), the repo has ~300 pre-existing ESLint issues (mostly `@typescript-eslint/no-explicit-any` in older modules). We fix **real-bug** lint issues in files we touch and avoid introducing new warnings; we don't tree-wide clean as part of a small task.

---

## How to add a test

1. **Find or extract the pure logic.** If the thing you want to verify lives inside a component or hook, extract it into `src/lib/<feature>-<concern>.ts` first.
2. **Create `src/test/<module-name>.test.ts`.** Follow the existing naming: one test file per module.
3. **Import via the right path:**
   - Frontend/shared in `src/`: `import { … } from "@/lib/…"`
   - Edge shared: `import { … } from "../../supabase/functions/_shared/…"` (relative, because Vitest resolves the file directly).
4. **Describe behavior, not implementation.** Prefer `describe("parseDirection")` + `it("returns 'down' for 'BTC is down 5%'")` over `it("calls .toLowerCase")`.
5. **For edge modules that read `Deno.env`**, stub `globalThis.Deno` in `beforeEach` and restore in `afterEach` (see `src/test/phase-config.test.ts`).
6. **Run `npm run test`.** It should pass on a clean checkout.

## Invariants

- **A new module in `src/lib/` or `supabase/functions/_shared/` with non-trivial logic ships with a test file.**
- **A new trust-boundary parser ships with a contract test** pinning behavior on garbage input.
- **A bug fix that could regress** gets a regression test in the same PR.
- **Tests never reach the network, Supabase, or a real Deno runtime.** Stub at the seam.

---

## Related docs

- [`backlog/e2e-browser-automation.md`](../backlog/e2e-browser-automation.md) — E2E deferral rationale and direction.
- [`fundamentals/http-review-playbooks.md`](http-review-playbooks.md) — Bruno/Postman review of edge functions (HTTP layer, not unit tests).
- [`fundamentals/refactoring-strategy.md`](refactoring-strategy.md) — extracting pure logic into `src/lib/` so it can be unit-tested (§2).
- [`AGENTS.md`](../../AGENTS.md) — commands, ESLint baseline, "where to edit."
