# Auth + Referral (Pending Enhancements)

## Enhancement 1: Guaranteed referral delivery — **implemented**

### What shipped (2026-04)

- **`referral_pending_jobs`** table: one row per referred user (`referred_user_id` unique), statuses `pending` → `processing` → `completed` / `failed`, with `attempts`, `next_attempt_at`, and `last_error`.
- **Client** (`src/features/auth/presentation/AuthProvider.tsx` / `useAuth`): on `SIGNED_IN` with `holzen_ref`, inserts a queue row then invokes `record-referral`. Clears `holzen_ref` on `{ ok: true }` or invalid referral; keeps it on invoke/network failure so a repeat sign-in can retry the HTTP path.
- **`record-referral`**: uses shared **`applyReferralRecord`** in `supabase/functions/_shared/referral-record-core.ts` (idempotent referrals + **`referral_rewards`** checks prevent double grants).
- **`process-referral-pending`**: cron worker with **`verifyServiceAuth`**; **`claim_referral_pending_jobs`** (SKIP LOCKED); stale `processing` rows requeued after 15 minutes; transient failures use backoff until `max_attempts`.
- **Ops**: schedule in **`docs/ops/cron-setup.md`**; Bruno **`bruno/service-cron/process-referral-pending.bru`**.

### How to verify

1. Queue a row, block or fail the first `record-referral` invoke — after cron runs, attribution appears in `referrals` and the job is `completed`.
2. Re-running attribution does not duplicate **`referral_rewards`** rows for the same milestone.
3. Inspect **`referral_pending_jobs`** for `pending` / `completed` / `failed` instead of relying only on client state.

### Related code pointers

- Producer: `src/features/auth/presentation/AuthProvider.tsx` (via `infrastructure/auth-signed-in-side-effects.ts`)
- HTTP: `supabase/functions/record-referral/index.ts`
- Core: `supabase/functions/_shared/referral-record-core.ts`
- Worker: `supabase/functions/process-referral-pending/index.ts`
- Migration: `supabase/migrations/20260403190000_referral_pending_jobs.sql`
