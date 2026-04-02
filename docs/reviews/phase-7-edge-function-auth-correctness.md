# Phase 7: Edge-function auth & correctness audit

## Scope

- `supabase/functions/companion-orchestrate/index.ts`
- `supabase/functions/holzen-reflect/index.ts`
- `supabase/functions/check-volatility/index.ts` (how it dispatches orchestrator + notifications)
- Regenerate path: `supabase/functions/_shared/regenerate-only.ts`

## High-risk finding: `companion-orchestrate` reflection ownership

### Problem (before fix)

`companion-orchestrate`:

- Authenticates the caller (user JWT vs service-role key).
- Creates a `svcClient` using the service-role key.
- Uses that service client to write into `reflections`-linked tables via `writeCompanionData(...)`.

Because the service-role client bypasses RLS, it is not enough to rely on RLS policies for cross-user protection. The function must explicitly ensure that any provided `reflectionId` belongs to the authenticated `userId` before writing companion data.

The main `companion-orchestrate` path did **not** previously perform a `reflections.user_id === userId` ownership check.

### Why it matters

If a malicious client can call `companion-orchestrate` with another user's `reflectionId`, the service-role client could write/overwrite companion data for that reflection (and related intervention payloads), resulting in cross-user data integrity issues.

### Fix applied

I added the ownership check in `supabase/functions/companion-orchestrate/index.ts`:

- If `reflectionId` is a non-empty string, the function queries `reflections` for `user_id`
- It rejects with `403` if the reflection is missing or not owned by `userId`

This aligns the main orchestration path with the regenerate-only path, which already did the ownership validation.

## Notes: regenerate-only path was already safe

`_shared/regenerate-only.ts` already:

- Fetches `reflections` by `reflectionId`
- Verifies `reflection.user_id === userId`
- Returns `403` if not found / mismatched

## Next questions / optional hardening

1. Should we enforce the same ownership check for any other write-capable edge functions that accept `reflectionId` (if there are more)?
2. Consider adding the same check as a shared helper to avoid future drift.

