# Settings data export (legacy)

JSON and CSV user-data export from Settings → Account — **not shipped** in pause-first MVP.

Moved from active `src/features/user/`, `src/features/pause/`, and `src/screens/settings/` per product scope strip.

## Re-enabling

1. Import `SettingsAccountDataExportSection` from `@/legacy/settings-data-export/public` into `SettingsAccountPanel` (above sign-out).
2. Update [docs/ops/active-surface.md](../../../docs/ops/active-surface.md) if export returns to shipped scope.

Legacy may import active `@/features/*` and `@/components/ui/*`; active code must not import `@/legacy/settings-data-export/**`.
