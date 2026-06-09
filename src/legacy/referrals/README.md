# Referrals (legacy)

Invite-friends UI, `?ref=` capture, auth sign-in side-effects, and referral milestone rewards — **not shipped** in pause-first MVP.

Moved from active `src/features/auth/`, `src/features/user/`, and `src/screens/settings/` per product scope strip.

## Postgres (still present)

Tables remain in production DB until an explicit cutover migration:

- `profiles.referral_code`, `profiles.referred_by`
- `referrals`, `referral_rewards`, `referral_pending_jobs`
- RPC `claim_referral_pending_jobs`

`npm run check:active-surface` blocks `.from('referrals'|'referral_rewards'|'referral_pending_jobs')`, `holzen_ref`, and `record-referral` in active `src/`.

## Edge (undeployed)

Handlers live under `supabase/functions/legacy/referrals/`:

- `record-referral` — user JWT attribution on sign-in
- `process-referral-pending` — service cron queue worker

Removed from `supabase/config.toml` and `EdgeCoverageScreen.tsx` COVERAGE. Bruno requests: `bruno/legacy/referrals/`.

## Re-enabling

1. Restore `[functions.record-referral]` and `[functions.process-referral-pending]` in `config.toml`; redeploy edges.
2. Wire `ReferralSection` back into `SettingsSubscriptionPanel`.
3. Call `runReferralOnSignedIn` from `AuthProvider` sign-in side-effects (or import from `@/legacy/referrals/public`).
4. Call `useCaptureReferralFromUrl()` on `LandingScreen` / welcome routes.
5. Re-wire pg_cron for `process-referral-pending` per [docs/ops/cron-setup.md](../../../docs/ops/cron-setup.md).
6. Update [docs/ops/active-surface.md](../../../docs/ops/active-surface.md) and remove referral guards from `check:active-surface.mjs`.

Legacy may import active `@/features/*` and `@/components/ui/*`; active code must not import `@/legacy/referrals/**`.
