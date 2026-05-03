# React SPA review template (flow-first)

**Purpose:** Repeatable **how** to review a React SPA—especially when you already know **what** to cover from [full-app-review-backlog.md](full-app-review-backlog.md) and the phased [phase-1-frontend-routing-auth.md](phase-1-frontend-routing-auth.md) … [phase-8-rls-hardening-service-role-policies.md](phase-8-rls-hardening-service-role-policies.md) series. For an **exhaustive checkbox inventory**, use [end-to-end-review-master-checklist.md](end-to-end-review-master-checklist.md).

**Philosophy (short):** Neither “frontend-first” nor “backend-first” alone is enough. A SPA is **user journeys → state → side effects → state → UI**. Trace **flows** first; use **screen/component** passes second, to judge local quality after the system makes sense.

**Holzen-specific:** The app is not “React only”—it is **React + Supabase (RLS, migrations) + Deno edge functions**. For production readiness, pair flow tracing with [fundamentals/http-review-playbooks.md](../fundamentals/http-review-playbooks.md), `bruno/SCOPE.md`, and Phases **3–8** in this folder. Size and automation context: [fundamentals/codebase-size-and-review-practices.md](../fundamentals/codebase-size-and-review-practices.md).

**After review drives refactors:** Follow [fundamentals/refactoring-strategy.md](../fundamentals/refactoring-strategy.md) (React **and** backend-adjacent principles) and the living checklist [backlog/react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md) for UI extraction—incremental slices, behavior parity, no tree-wide rewrites. SQL/RLS/edge contract changes follow the same incremental rule but use [ops/migration-security-conventions.md](../ops/migration-security-conventions.md) and [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md).

---

## When to use which variant

| Variant | Audience | Depth |
|--------|----------|--------|
| **PR checklist** | Author + reviewer on a normal PR | Minutes; scoped to the PR’s flow or surface |
| **Audit template** | Onboarding, pre-launch hardening, consulting | Hours; multiple flows + cross-cutting |

Do **not** try to fill every audit section for every PR. For PRs: pick the **one flow** the PR touches and run the PR checklist. For audits: pick **2–3 critical flows** from the backlog table and fill **Flow review** deeply; use other sections as targeted scans.

---

## Holzen pointers (pin these while reviewing)

- **Routes / guards:** `src/App.tsx`, [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md), [design/information-architecture.md](../design/information-architecture.md).
- **Edge invokes:** Prefer patterns in [AGENTS.md](../../AGENTS.md) (`invokeEdge`, `x-cid`); new call sites should not break correlation.
- **Observability / events:** [ops/event-taxonomy.md](../ops/event-taxonomy.md), [ops/feature-flags.md](../ops/feature-flags.md) when behavior is flag-gated.
- **Ship checklist:** [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md) when changes touch migrations, edge functions, or env-driven behavior.

---

## PR review checklist (fast)

**Context (one line each):** PR intent · primary route(s) · user-visible behavior change?

**Flow trace (the PR’s slice):**

- [ ] Entry: route + root component/hook for this change
- [ ] Trigger: what user action or effect starts the work?
- [ ] State: local vs shared; any unnecessary global coupling?
- [ ] I/O: Supabase client, `functions.invoke` / `invokeEdge`, storage—errors handled?
- [ ] UI: loading / error / empty states for new or changed async paths

**Quality gates (repo):**

- [ ] Tests updated or added where behavior is non-trivial (`npm run test`)
- [ ] Build/version sync if required (`npm run build` per [deployment-sync-guide.md](../ops/deployment-sync-guide.md))
- [ ] Lint on **touched files** only (whole-repo lint is noisy per AGENTS)

**Smells in diff:**

- [ ] Duplicated API/query logic that should reuse an existing hook or lib
- [ ] Business rules embedded in JSX (prefer hook / `src/lib`)
- [ ] Magic strings for routes, event names, or edge function names (use existing constants or enums where the codebase already does)
- [ ] New edge HTTP entrypoint without `withRequestLogging` (see `npm run check:edge-logging`)

**Verdict:** Approve / Approve with nits / Request changes — **one sentence** on biggest risk.

---

## Audit template (deeper)

### 0. Context

| Field | Notes |
|--------|--------|
| App purpose / domain | |
| Stack (router, data layer, forms, styling) | Holzen: Vite, React Router, TanStack Query, RHF+Zod, Tailwind/shadcn |
| **Flows in scope (2–3)** | Pull candidates from [full-app-review-backlog.md](full-app-review-backlog.md) |
| Out of scope this pass | e.g. “UI only; RLS covered in Phase 6 doc” |

### 1. Flow review (repeat per flow)

**Flow name:** …

1. **Entry:** Route (`App.tsx`) · component · hook(s)
2. **UI → state:** Triggers · where state lives (local / context / query cache / custom hook)
3. **State → API:** Hook or lib module · error handling · retries (if any)
4. **API → state:** Normalization · cache updates · race conditions
5. **State → UI:** Loading · error · empty · success
6. **Flow quality:** End-to-end traceable? Duplicated logic? Hidden side effects? Predictable transitions?

**Verdict per flow:** Strong / OK but fragile / Problematic — notes:

### 2. Screen or feature slice (after flows)

For each major screen or widget cluster: structure, state colocation, data fetching duplication, UI states, readability (thin JSX).

### 3. State and data architecture

Global vs local; query key conventions; “god hook” or god store smells; duplicated client state vs server state.

### 4. Routing and access control

Route table clarity; auth and permission guards; deep links and navigation edge cases.

### 5. Performance and bundles

Obvious rerender issues; intentional memoization; lazy routes if relevant.

### 6. Cross-cutting

Error boundaries; auth/session; forms/validation patterns; env and secrets; logging/analytics (Holzen: Sentry, PostHog, `x-cid`).

### 7. High-signal smell list

Mark what you saw: duplicate API implementations · oversized files · logic in JSX · over-globalized state · inconsistent loading/error UX · tight coupling to raw API shapes · magic strings.

### 8. Final assessment

Architecture quality · top risks · **ordered** improvements (highest impact first) · what to ticket vs fix in the same initiative.

---

## Cursor skill (project)

A short wrapper lives at **`.cursor/skills/holzen-flow-review/SKILL.md`** so agents load the same workflow without duplicating checklists. **This markdown file stays canonical** for the full PR + audit text.

---

## Related

- [end-to-end-review-master-checklist.md](end-to-end-review-master-checklist.md) — **exhaustive** route / edge / cross-cutting checkboxes for a full pass
- [full-app-review-backlog.md](full-app-review-backlog.md) — **inventory and sequencing** of Holzen flows
- [fundamentals/refactoring-strategy.md](../fundamentals/refactoring-strategy.md) — **how to refactor** after review without big-bang rewrites
- [fundamentals/navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md) — **where** code and patterns live
