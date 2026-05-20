# Holzen postmortems and invariants

This document captures the *“why”* behind key parts of the codebase that we changed during reviews.
The goal is to preserve the underlying invariants so future contributors can reason about behavior without
re-deriving the same mental model from scattered files.

## How to use this

- Treat the sections in this file as **design invariants** (things that must stay true).
- Treat the “Postmortem entries” as **root cause → impact → fix** writeups.
- For the full audit trail (files changed, more detail), follow the links to the phase review docs under `docs/reviews/`.

## Core invariants we’ve explicitly hardened

1. **Fire-and-forget async side effects must still be “safe”**
   - If we intentionally don’t await something, we still must:
     - handle errors (avoid unhandled rejections),
     - and ensure any local state changes happen in a way that supports retry or recovery.

2. **Pause UI must hydrate from the canonical client state**
   - Deep links (like `/pause` from notifications) may pass incomplete `location.state`.
   - The UI must fall back to `useHolzen()`’s loaded reflection fields rather than showing a permanent “no reflection” dead-end.

3. **Any service-role write that uses `pauseInstanceId` must validate ownership**
   - Service-role clients bypass RLS.
   - If user input can influence which rows are written, the edge function must explicitly check `pause_instances.user_id === userId`.

4. **Edge/cron pipelines are eventually consistent**
   - Cron/edge workers may create a “pause ready” record before companion rows are fully generated.
   - The UI must treat companion content as “may still be loading” rather than assuming immediate completeness.

## Postmortem entries

### 1. Referral recording robustness (Phase 1)

- Root cause (2024): `src/hooks/use-auth.tsx` *(now `@/features/auth/public`)* initiated `supabase.functions.invoke('record-referral', ...)` without awaiting it and without attaching a `.catch(...)`. It also removed `holzen_ref` from localStorage before the invoke result was known.
- Impact:
  - potential unhandled rejection/noisy error path,
  - referral code lost permanently on failure → referral rewards might not trigger.
- Fix applied:
  - keep `holzen_ref` until the invoke resolves,
  - attach `.catch(...)` and log failures.
- Phase doc: `docs/reviews/phase-1-frontend-routing-auth.md`

### 2. Pause deep-link hydration & session restoration (Phase 2)

- Root cause: `/pause` deep links (notably from the notification bell) may provide only `pauseInstanceId` without `reflectionMessage/context`.
  Meanwhile, `PauseSession.tsx` could discard/restore local session state in a way that left `message` empty temporarily, showing the wrong UI state.
- Impact: notification-driven entry into the pause flow could land in the “no reflection” overlay or otherwise fail to render featured content.
- Fix applied:
  - hydrate message/context/featured companions/prefs from `useHolzen()` when `location.state` is incomplete,
  - tighten the session mismatch guard to discard saved session whenever `pauseInstanceId` differs,
  - avoid showing the “no reflection” screen while `useHolzen` is still hydrating.
- Phase doc: `docs/reviews/phase-2-manual-pause-pipeline.md`

### 3. Cross-user pause write hardening (Phase 7)

- Root cause: `companion-orchestrate` uses a service-role Supabase client for writes (RLS bypass). Without an explicit ownership check, a malicious caller could potentially write companion/intervention data to a pause they don’t own (by supplying another user’s `pauseInstanceId`).
- Impact: cross-user data integrity risk.
- Fix applied:
  - `companion-orchestrate` now checks that the provided `pauseInstanceId` belongs to `userId` (403 if not).
- Phase doc: `docs/reviews/phase-7-edge-function-auth-correctness.md`

