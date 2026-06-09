# Referrals (legacy)

Invite-friends UI, `?ref=` capture, auth sign-in side-effects, and referral milestone rewards — **not shipped** in pause-first MVP.

Moved from active `src/features/auth/`, `src/features/user/`, and `src/screens/settings/` per product scope strip.

## Postgres (dropped)

Migration `20260610210000_pause_first_referral_schema_cleanup.sql` drops:

- `referrals`, `referral_rewards`, `referral_pending_jobs`
- `profiles.referral_code`, `profiles.referred_by`
- RPC `claim_referral_pending_jobs`
- `app_config` key `heartbeat.process_referral_pending`

Re-enabling requires restoring schema from git history **before** that migration, then following the steps below.

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
