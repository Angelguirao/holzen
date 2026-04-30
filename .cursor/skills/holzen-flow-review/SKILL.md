---
name: holzen-flow-review
description: >-
  Holzen flow-first code review: trace user journeys (UI → state → Supabase/edge → UI)
  before screen-by-screen polish. Use for PR review, onboarding passes, or pre-launch audits.
---

# Holzen flow-first review

**Canonical templates (do not duplicate here):**

- **Exhaustive tick list (routes, settings, edges, cross-cutting):** [docs/reviews/end-to-end-review-master-checklist.md](../../../docs/reviews/end-to-end-review-master-checklist.md)
- **PR + audit questions per slice:** [docs/reviews/react-spa-review-template.md](../../../docs/reviews/react-spa-review-template.md)

## When to use

- Reviewing a PR that touches a user-visible path (routes, hooks, edge invokes).
- Planning a systematic pass over the app (pair with the backlog below).
- Deciding whether a refactor is warranted after tracing a flow.

## Workflow (in order)

1. **Orient (short):** [docs/fundamentals/navigating-the-codebase.md](../../../docs/fundamentals/navigating-the-codebase.md), `src/App.tsx`, [AGENTS.md](../../../AGENTS.md) for stack and conventions.
2. **Pick scope:** For end-to-end review, work through [docs/reviews/end-to-end-review-master-checklist.md](../../../docs/reviews/end-to-end-review-master-checklist.md) in tier order (or for a PR, pick the **one flow** the PR affects). Narrative + estimates: [docs/reviews/full-app-review-backlog.md](../../../docs/reviews/full-app-review-backlog.md).
3. **Trace end-to-end:** UI trigger → local/query state → Supabase client or `invokeEdge` / `functions.invoke` → state updates → loading/error/empty UI. Note gaps and smells.
4. **Apply the right template:** PR → “PR review checklist” in the template doc; deeper pass → “Audit template” sections.
5. **If refactoring:** [docs/fundamentals/refactoring-strategy.md](../../../docs/fundamentals/refactoring-strategy.md) and ship in **vertical slices**; track progress in [docs/backlog/react-page-and-hook-splitting.md](../../../docs/backlog/react-page-and-hook-splitting.md).

## Holzen reminders

- **Security / RLS / cron:** Phased docs under [docs/reviews/](../../../docs/reviews/) (phase-1 … phase-8)—not optional for “production ready.”
- **HTTP-only review:** [docs/fundamentals/http-review-playbooks.md](../../../docs/fundamentals/http-review-playbooks.md) and [bruno/SCOPE.md](../../../bruno/SCOPE.md) complement browser flow tracing.
- **Push / migrations / edges:** [docs/ops/deployment-sync-guide.md](../../../docs/ops/deployment-sync-guide.md).
