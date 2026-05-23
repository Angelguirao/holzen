# Phase 1: Frontend routing & authentication review

> **Pre-strip / security reference (2026-05).** Shipped product scope: [active-surface.md](../ops/active-surface.md). Some routes below describe full IA (tag `full-ia-pre-strip`).

This phase is the first "mental model pass" for the codebase because authentication and routing determine:

1. Which code paths run for a given user (or when the user is still loading).
2. Whether unauthenticated/deep-linked users land in the correct UI state.
3. Where the "source of truth" for user state lives.

If we get auth/routing wrong, everything downstream (pause UI, journaling, admin surfaces, edge-function calls) becomes hard to reason about or debug.

## Table of Contents

- [What to understand first (priority)](#what-to-understand-first-priority)
- [Mental Models & Useful Concepts](#mental-models--useful-concepts)
- [CS/SE Concepts to Know (for this phase)](#csse-concepts-to-know-for-this-phase)
- [Reviewed starting points (file-by-file)](#reviewed-starting-points-file-by-file)
- [Runtime touchpoints: endpoints, events, and side effects](#runtime-touchpoints-endpoints-events-and-side-effects)
- [Data models affected](#data-models-affected)
- [Systems that emerge from this review](#systems-that-emerge-from-this-review)
- [Reviewer Questions Checklist](#reviewer-questions-checklist)
- [Conclusions and Tradeoffs](#conclusions-and-tradeoffs)
- [What to Review Next and Why](#what-to-review-next-and-why)

## What to understand first (priority)

1. **Boot + provider wiring**: does `AuthProvider` wrap `Routes` so `useAuth()` is always available?
2. **Route guards**: do `ProtectedRoute` / `PublicOnlyRoute` correctly handle `loading` vs "no user"?
3. **Session persistence**: does the Supabase client persist sessions the way the app assumes?
4. **Side effects safety**: if auth triggers a side-effect (referral), is it error-safe and doesn't corrupt local state?

## Mental Models & Useful Concepts

- **Source of truth is layered**: `AuthProvider` owns `user` + `loading`, route guards decide *what to render*, and individual pages decide *what to do* (e.g. `/pause` hydration fallback).
- **Route state vs persisted state**: `location.state` (ephemeral navigation payload) must be treated differently from persisted state (`profiles.last_*` and local session storage used by the pause flow).
- **"Loading" is part of auth correctness**: route guards should distinguish "not logged in yet" from "definitely logged out" so we don't accidentally show the wrong UI.
- **Side effects must be monotonic**: if a side-effect depends on local data (like a referral code), that local data shouldn't be cleared before the side-effect has succeeded.

## CS/SE Concepts to Know (for this phase)

These are the concepts that most directly help you review auth + routing correctly.

- **State machines (finite states + transitions)**: treat auth as a small state machine (`loading` -> `authenticated|unauthenticated`) and confirm every route/UI path handles each state.
- **TOCTOU / race thinking**: time-of-check vs time-of-use in UI (e.g., auth `loading` resolving after a redirect decision).
- **Idempotency + replay**: auth events can replay (multi-tab, reconnect, refresh). Side effects should be safe under repeats.
- **Eventual consistency**: some state is delayed (profile loads, auth session restore). Review which screens tolerate late-arriving state.
- **Trust boundaries**: UI state is not authorization. Authorization must be enforced server-side (RLS, edge functions, DB constraints).
- **Failure-mode design**: distinguish "retry later" vs "hard failure" for session restore and side effects.

## Reviewed starting points (file-by-file)

### `src/main.tsx` — boot + crash visibility

- Responsible for the app entrypoint: it loads `App.tsx`, loads i18n, and mounts React.
- Has a global crash screen so "auth never loads" failures don't become silent.

### `src/App.tsx` — routing + route guard contracts

- Defines `ProtectedRoute` and `PublicOnlyRoute`.
- Controls the redirect behavior for:
  - protected pages (e.g. `/pause`, `/admin`): redirect to `/welcome` if unauthenticated
  - public-only pages (e.g. `/welcome`, `/auth`): redirect to `/` if authenticated

### `src/app/components/AppLayout.tsx` — the protected shell

- Renders the "app shell" that sits under protected routes.
- Hosts shared UI elements like the notification bell and pause auto-trigger banner.
- Important because it receives `Outlet` context from the route layer.

### `src/integrations/supabase/client.ts` — session persistence assumptions

- Creates the browser Supabase client.
- Defines how auth state is stored (localStorage) and refreshed (auto token refresh).
- This determines whether the app can assume "user survives reload" behavior.

### `@/features/auth/public` — `AuthProvider` / `useAuth()`

- `AuthProvider` is the single shared authority for:
  - `user`
  - `loading`
- It initializes state via `supabase.auth.getSession()` and keeps it updated via `supabase.auth.onAuthStateChange(...)`.
- Also triggers the referral recording side-effect when a user signs in.

## Runtime touchpoints: endpoints, events, and side effects

- **Auth event source**: `supabase.auth.onAuthStateChange(...)`
  - Key event to reason about here: `SIGNED_IN`
- **Auth session restore**: `supabase.auth.getSession()`
  - Determines how the app behaves on reload and cold start.
- **Edge function invoked (referral side effect)**: `record-referral`
  - Client invoke: `supabase.functions.invoke('record-referral', { body: { referral_code } })`
  - Server handler: `supabase/functions/record-referral/index.ts`
  - Important properties to review:
    - failure handling (no unhandled rejections)
    - monotonicity of local state (`holzen_ref` only removed on success)
    - effective idempotency (server rejects "already referred" cases)

## Data models affected

Even though this phase is "frontend routing/auth", it touches data contracts:

- **`profiles`**
  - Stores the referrer's `referral_code` (looked up by `record-referral`)
  - May be updated for rewards (e.g., `lifetime_access`)
- **`referrals`**
  - Server records "referred user" association; also used to detect "already referred".
- **`referral_rewards`**
  - Server records milestone rewards; should be idempotent per `(user_id, milestone)` logic.
- **Browser local state**
  - `localStorage.holzen_ref` is a client-side input to the referral side-effect.

## Systems that emerge from this review

1. **Auth system**: `docs/systems/auth/auth-and-referral-system.md`
   - Step-by-step runtime path for boot -> auth state -> route gating -> optional referral side-effect.

2. **Route gating system**: `docs/systems/routing/route-gating-system.md`
   - How `ProtectedRoute` and `PublicOnlyRoute` use `loading` + `user`, redirects (`/welcome`, `/`), and which routes are ungated.

## Reviewer Questions Checklist

Use these as "prove-or-disprove" questions while reading the Phase 1 files.

1. What are the explicit auth states in this UI: `loading`, `authenticated`, and `unauthenticated`, and are the transitions exhaustive?
2. Can any protected route render its sensitive UI while auth is still `loading` (race/flash-of-incorrect-content)?
3. Are redirects deterministic, and is there any possibility of a redirect loop between public-only and protected routes?
4. If `supabase.auth.getSession()` fails, times out, or returns `null` temporarily, do we end up stuck in `loading` or do we degrade safely to a known state?
5. Are the session persistence assumptions (Supabase client storage + refresh behavior) aligned with how the app expects "user survives reload" to work?
6. For side effects (like referral recording), is the side effect "monotonic" with respect to local state (we don't clear inputs before success)?
7. Is the side effect idempotent (or at least effectively-once) under event replay (reconnects, multiple tabs, rapid auth state changes)?
8. Are all async failure paths handled (errors logged + no unhandled promise rejections), without swallowing issues that would require user-visible recovery?
9. Are we treating navigation payloads like `location.state` as untrusted (hints), while correctness still derives from persisted DB data when needed?
10. What is the minimal security assumption we're making in the UI layer, and what must be enforced on the backend/edge layer for actual authorization?

## Conclusions and Tradeoffs

From a Phase 1 "robustness & security-contract" perspective, the design is broadly sound:
- `AuthProvider` gives a clear source of truth for `user` and `loading`, which makes route gating feasible and reduces accidental rendering before auth settles.
- The referral side-effect is handled in an error-safe way: it is fire-and-forget, but `holzen_ref` is only cleared after a successful invoke, and errors are caught/logged.
- The remaining critical correctness property (authorization) should still be enforced server-side via Supabase RLS / backend checks; the UI can only prevent accidental UX, not guarantee security.

Tradeoffs / alternatives to consider:
- Fire-and-forget vs guaranteed delivery: a caught/logged async invoke still means "eventual success," not "confirmed success." Alternative: persist a "pending referral" row and let an edge/cron worker retry with idempotency keys.
- Strict gating vs perceived latency: blocking protected UI until `loading` is false prevents incorrect rendering but can delay perceived responsiveness. Alternative: show skeletons while loading, but never show protected content.
- Relying on `location.state` vs canonical DB state: using navigation state is fast, but it's ephemeral and can be missing. Alternative: always re-hydrate critical pause/session fields from DB when entering the pause route.

## What to Review Next and Why

Phase 2 is **not** "the next arbitrary folder in the repo." It is the **first end-to-end product path** after auth: a logged-in user triggers a **manual pause**, which creates or loads **reflection state**, runs the **pause session UI**, and pulls in **companions** via edge functions. That is why we review it next instead of, for example, Library-only flows, marketing pages, or admin tools first.

**Why this slice (manual pause pipeline) and not something else?**

1. **Builds directly on Phase 1**: Phase 1 answered who can reach `/pause` and how `user` / `loading` behave. Phase 2 answers what happens **inside** the app once that gate opens: which hooks write what, and what `PauseSession` must consume. Other areas often assume that contract without defining it.

2. **Highest cross-cutting integration early**: This slice touches **React hooks**, **Supabase client writes**, **edge functions** (e.g. `holzen-reflect`, `companion-orchestrate`), and **Postgres** (`pause_instances`, `pause_ai_artifacts`, `profiles`) in one story. Understanding it first gives you vocabulary for later phases (cron, RLS, workers).

3. **What we are not prioritizing first (and why)**:
   - **Library / profile / settings**: mostly CRUD and preferences on top of the same session; fewer moving parts than pause + AI + session persistence.
   - **Blog / legal / marketing**: mostly static or content-driven; little overlap with the pause data pipeline.
   - **Admin**: small audience; easier once you know what data the app creates and how.
   - **Billing / Stripe**: critical, but often clearer after you know what subscription-gated features and rows exist.

4. **What Phase 2 will verify**: The **producer/consumer contract** — what `use-holzen` (and related hooks) write, what `PauseSession` and `PauseReflect` expect, and how `use-companion-data` + `companion-orchestrate` extend or replace that state — then the related edge functions and SQL writes.

**Trace (Phase 2 scope):**

- `/pause` -> `PauseSession` -> `use-holzen` -> reflection insert -> `use-companion-data` -> `companion-orchestrate`

Step-by-step review doc: `docs/reviews/phase-2-manual-pause-pipeline.md` (same section layout as this Phase 1 doc: TOC, mental models, touchpoints, checklist, conclusions, next phase).
