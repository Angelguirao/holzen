# Referrals (legacy Bruno)

Undeployed edges — restore `[functions.*]` in `supabase/config.toml` before smoke testing.

| Request | Edge | Auth |
| --- | --- | --- |
| `record-referral.bru` | `record-referral` | User JWT |
| `process-referral-pending.bru` | `process-referral-pending` | `SERVICE_CRON_BEARER` |

Recovery: [src/legacy/referrals/README.md](../../../src/legacy/referrals/README.md).
