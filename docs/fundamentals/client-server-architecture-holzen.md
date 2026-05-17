# Client–server architecture (Holzen)

This note is the **canonical place** for **where authority lives** in Holzen: how the **browser SPA**, **Supabase (Postgres + RLS + edge functions)**, and **shared TypeScript** fit together. It complements [navigating-the-codebase.md](navigating-the-codebase.md) (concrete file map), [react-screen-orchestration.md](react-screen-orchestration.md) (large-screen React patterns), and [mental-models-for-contributors.md](mental-models-for-contributors.md) (glossary and SPA basics).

**Pause-first strip (2026-05):** `src/legacy/` and `supabase/functions/legacy/` are **read-only reference** for the pre-strip full product — not a second runtime or alternate backend. Active code must match [active-surface.md](../ops/active-surface.md).

---

## Thesis

- **Postgres + RLS + migrations (+ RPCs where used)** and **edge functions** that orchestrate side effects define **what is true** and **what is allowed**.
- The **React app** defines **what the user sees and does**, holds a **cached projection** of server data (especially via TanStack Query), and may apply **advisory** checks for UX.
- **TypeScript types** (including `src/integrations/supabase/types.ts` and narrow shapes at boundaries) are a **shared language**, not a place to **share business behavior** between client and server bundles.

---

## Three “realities” in one product

| Reality | Role |
|--------|------|
| **Browser (Vite SPA)** | Interaction, routing, optimistic UX, TanStack Query cache |
| **Supabase** | Auth, Postgres, RLS, RPCs, storage, Deno edge HTTP |
| **Shared types** | Contracts and discoverability; compile-time alignment |

A **monorepo** (if you ever split `apps/web` + packages) is organizational; it does **not** relax the rule: **do not import edge “domain” modules into `src/`** or duplicate server rows in a global UI store alongside Query.

---

## Layer names mapped to Holzen

The labels **domain / application / infrastructure** are useful **mental** buckets. They do not require new top-level folders in this repo today.

### Server side (authoritative)

| Layer | Meaning here | Typical locations |
|-------|----------------|-------------------|
| **Domain (truth)** | Invariants, authorization data model, state that must stay consistent | `supabase/migrations/` (constraints, RLS, triggers, functions), RPC definitions; pause and other **system** docs under `docs/systems/` |
| **Application** | Orchestrate a user or system action: validate input shape, call DB/RPC, call Stripe or AI, emit audit/logs | `supabase/functions/*/index.ts` and `_shared/*` (use **thin** HTTP entrypoints; heavy paths stay testable helpers where feasible) |
| **Infrastructure** | HTTP transport, external APIs, log drain, Sentry | `withRequestLogging`, `observe.ts`, `invoke` from cron/webhooks |

**Rule:** If a rule must **never** be bypassed by a modified client, it belongs in **SQL/RLS**, **privileged RPCs**, or **edge**—not only in React.

### Client side (projection + UX)

| Layer | Meaning here | Typical locations |
|-------|----------------|-------------------|
| **UI** | Components and pages: render state, forward user intent | `src/pages/`, `src/components/` |
| **Application** | Hooks that orchestrate: queries/mutations, navigation, composing multiple data sources | `src/hooks/`, feature hooks colocated with screens |
| **Infrastructure** | Browser I/O: Supabase client, `invokeEdge`, `fetch`, `localStorage` | `src/integrations/supabase/`, `src/lib/*-api.ts` patterns |
| **Domain (advisory)** | Pure helpers: “should we show this CTA?”, formatting, client-side validation **before** submit | `src/lib/` (unit-testable; **not** the final word on permission) |

---

## Structural symmetry, semantic asymmetry

**Symmetric:** Both sides have **orchestration** (hooks vs edge handler steps) and **I/O** (client vs DB/HTTP).

**Asymmetric:**

| | Server | Client |
|---|--------|--------|
| **Enforcement** | Final | Best-effort |
| **Trust** | Trusted | Untrusted |
| **Failure** | Correctness bug | Usually UX degradation |

**Example:** Hiding an “Accept” button when status is not pending is **UX**. Rejecting the same action in SQL/RLS or edge is **truth**.

---

## Server state vs UI-only state

- **Server-shaped data** (profiles, subscriptions, lists owned by the backend): prefer **TanStack Query** (`useQuery` / `useMutation`) with clear **query keys** and **invalidation** (or targeted `setQueryData`) after writes. Operational rules: [navigating-the-codebase.md](navigating-the-codebase.md) §6.1 and [backlog/data-fetching-conventions.md](../backlog/data-fetching-conventions.md).
- **Ephemeral UI** (modal open, selected row id, local filters): `useState`, React context, or—only if cross-cutting— a small client store. **Do not** treat a second copy of API rows in a global store as the source of truth when Query already caches them.

Holzen does not mandate **Zustand**; if you introduce it for UI-only state, keep it **strictly non-authoritative** and avoid duplicating Query caches.

---

## Contracts without a `packages/contracts` package

Until multiple deployable apps share packages, **contracts** live in:

- Generated **`Database`** types and hand-tightened types in `src/integrations/supabase/types.ts` (regenerate when schema changes; see [deployment-sync-guide.md](../ops/deployment-sync-guide.md)).
- **Request/response shapes** documented or typed at **edge boundaries** and Bruno/HTTP playbooks ([http-review-playbooks.md](http-review-playbooks.md)).

**Share types, not domain logic** across client and edge code paths.

---

## Anti-patterns (review red flags)

- **Authoritative lifecycle** implemented only in React (e.g. “booking accepted” with no matching RLS/edge/RPC enforcement).
- **Fat edge handlers** with pages of branching and no extracted steps or tests.
- **Mirroring** server transitions in the client **without** reconciliation on error (optimistic UI without rollback + invalidate).
- **Duplicate sources of truth**: same entity updated in TanStack Query and a global “app store” from the same API.

---

## End-to-end flow (mental picture)

```text
User action → UI → hook (application) → invokeEdge / Supabase (infrastructure)
       → edge or DB (truth) → response → Query cache / invalidation → UI
```

Correlation: keep **`x-cid`** on edge calls per [AGENTS.md](../../AGENTS.md).

---

## Where to go deeper

| Topic | Doc |
|-------|-----|
| Pause truth + AI pipeline | [systems/pause-system.md](../systems/pause-system.md), [systems/pause/ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) |
| Auth + RLS | [systems/auth/auth-and-referral-system.md](../systems/auth/auth-and-referral-system.md) |
| Refactors across UI and lib | [refactoring-strategy.md](refactoring-strategy.md) |
| Edge HTTP + logging | [ops/edge-logging-conventions.md](../ops/edge-logging-conventions.md) |
| PR / flow review | [reviews/react-spa-review-template.md](../reviews/react-spa-review-template.md) |

### External concepts (optional reading)

These names describe **ideas** Holzen maps pragmatically; they are not a mandate to adopt every pattern:

- **Domain-Driven Design** — bounded contexts, aggregates, ubiquitous language (Eric Evans; Vaughn Vernon for tactical patterns).
- **Clean Architecture** — dependency direction toward domain, use cases as application boundary (Robert C. Martin).
- **Hexagonal / ports and adapters** — isolate core logic from IO (Alistair Cockburn).

---

## Summary

1. **Server defines reality** (Postgres, RLS, edge).
2. **Client simulates and projects** it (React + Query + advisory `src/lib` helpers).
3. **Types align** the two; **behavior** must not drift into “two backends.”
4. **Structure follows complexity** — use this doc for **boundaries**; use [react-screen-orchestration.md](react-screen-orchestration.md) for **page mechanics**.
