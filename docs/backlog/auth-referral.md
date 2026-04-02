# Auth + Referral (Pending Enhancements)

## Enhancement 1: Guaranteed referral delivery (within retry policy)

### Current problem
The referral side-effect is initiated during `SIGNED_IN` as an async fire-and-forget invocation of the edge function `record-referral`.

That means if the invoke fails transiently (network/server edge outage, token/session mismatch, etc.), the referral might never be recorded.

### Implications if we leave it as-is
- Referral attribution becomes non-deterministic (some sign-ups through a referral link won't be credited).
- We lose observability: there is no durable "pending" state that tells us whether it succeeded vs failed.
- It is harder to build safe retries later because there is no idempotent work item to retry.

### Proposed improvement
Persist a durable "pending referral" work item (DB queue row or similar) and have a retry worker (edge/cron) process it with:
- an idempotency key (so retries do not double-credit rewards)
- explicit completion/failure status updates

### Related code pointers
- Producer: `src/hooks/use-auth.tsx` (the `SIGNED_IN` handler invokes `record-referral`)
- Consumer: `supabase/functions/record-referral/index.ts` (validates token, referral code, and grants rewards)

### Acceptance criteria / how to verify
1. If `record-referral` is temporarily failing during the initial sign-in, the referral still gets recorded later (within the retry policy).
2. Retries do not produce duplicate reward grants (idempotency is enforced).
3. The client no longer relies on ephemeral success; “work completed” is observable in the DB (pending item transitions to done).

