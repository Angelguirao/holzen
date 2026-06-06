# ADR: Browser extension via Plasmo (behavioral wedge)

**Date:** 2026-05-26  
**Status:** accepted (direction — not yet implemented)  
**Strategy:** [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md)  
**Backlog:** [browser-extension-behavioral-mvp.md](../backlog/browser-extension-behavioral-mvp.md)

## Context

Holzen’s core product is **behavioral and contextual**: interventions during volatility matter most when users are **on market sites** (CoinMarketCap, TradingView, exchanges), not only inside the pause-first SPA.

The shipped web app (`src/`, Vite) is the **ritual home** — breathing, reflection, companions, subscription. It cannot observe cross-site refresh loops, tab revisits, or inject overlays on third-party domains.

**First hypothesis to validate:** a contextual intervention can **measurably reduce compulsive price checking** during volatility (see strategy doc §5).

Alternatives considered:

| Option | Why not first |
|--------|----------------|
| **Native mobile app** | High reach for quick checks, but low observability and OS restrictions on intervention |
| **Rebuild web on Next.js** | No validation benefit; current Vite SPA already ships pause |
| **Vanilla MV3 extension** | Faster to ship one script, but forks React/Tailwind patterns and slows shared UI with SPA |
| **Safari-only / single-browser** | Crypto power users skew Chrome/Firefox + TradingView desktop |

We need a **TypeScript + React** extension surface that shares tokens, rules, and auth patterns with the existing stack.

## Decision

1. **Adopt [Plasmo](https://www.plasmo.com/)** as the browser extension framework when implementation starts: React, TypeScript, content scripts, overlays, Chrome + Firefox from one codebase.

2. **Keep the root Vite SPA** as the authoritative pause ritual. The extension **extends** Holzen — it does not replace or duplicate `/pause` logic in v0.

3. **First wedge:** volatility + compulsive checking on an allowlisted set of market domains (see backlog ticket). v0 interventions are **rules + UX**, not new AI pipelines.

4. **Shared logic target:** extract intervention thresholds and event schemas into a shared package (`packages/behavioral-engine` or equivalent) once SPA + extension both consume the same rules. Until then, duplicate minimally and document in [implementation-notes.html](../artifacts/client-implementation/implementation-notes.html).

5. **Backend unchanged for MVP:** Supabase auth, Postgres, existing edges. Extension uses the same session model and **`x-cid`** on any `invokeEdge` calls. No new edge function is required for telemetry-only v0 unless we need server-side aggregation.

6. **Monorepo placement (north star):** `apps/extension/` alongside `apps/web/` per [frontend-module-layout.md](../fundamentals/frontend-module-layout.md). Extraction gate: extension repo slice + CI for Plasmo build; not blocked on moving SPA to `apps/web`.

7. **Analytics:** extension events use PostHog with `surface: 'extension'` super-property; names prefixed `extension.*` (planned in [event-taxonomy.md](../ops/event-taxonomy.md) §Planned). Update taxonomy in the same PR as first `trackEvent` call sites.

## Consequences

**Positive**

- Highest-leverage surface for **behavioral observability** and **contextual overlays** without owning market sites
- Same language ecosystem as SPA + Deno edge (TypeScript end-to-end)
- Plasmo DX for HMR, manifest, and multi-browser builds
- Validates company thesis before mobile or SDK investment

**Negative / tradeoffs**

- **Store review** and permission UX (`host_permissions`, content scripts) — must be minimal and explainable
- **Auth in extension context** — Supabase session storage differs from SPA; needs explicit design (shared refresh token, deep link to web sign-in)
- **Not where most casual price checks happen** (mobile) — extension targets power users and measurable desktop behavior first
- **Second deployable** — CI, versioning, and release cadence beyond Vercel SPA

**Follow-ups**

- Implement [browser-extension-behavioral-mvp.md](../backlog/browser-extension-behavioral-mvp.md) phases A→D
- Update [c4-holzen.md](../architecture/c4-holzen.md) container diagram when `apps/extension` ships
- Add `check:*` guard if extension imports from `@/legacy` or bypasses `invokeEdge` (future)

## Related

- [2026-05-17-modular-monolith-hexagonal-client.md](./2026-05-17-modular-monolith-hexagonal-client.md) — packages + `apps/web` north star
- [pause-system.md](../systems/pause-system.md) — ritual authority remains in SPA + Postgres
