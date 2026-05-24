# Bulk hold (quarantined)

Home **Bulk hold** UI was removed from the pause-first shipped surface (May 2026).

It let users retrospectively log `held` / `bought` / `sold` on many expired pauses at once for stats alignment. That conflicts with the product stance: Holzen celebrates completed pauses, not trade-label hygiene.

**Recovery:** git history before removal; search `BulkHoldCard`, `apply-bulk-hold-outcomes`, `bulk-hold-pending-query`.

Postgres still allows retrospective `outcome_logged` on `expired` / `dismissed` rows via `pause_log_step` (no active UI).
