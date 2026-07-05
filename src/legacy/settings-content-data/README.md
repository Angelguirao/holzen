# Settings content & data (legacy)

Companion type toggles and signal/grounding source management — **not shipped** in pause-first MVP.

**Active:** `signal_sources` catalog only (companion orchestration reads demoted-for-live rows server- and client-side).

**Dropped:** `user_signal_preferences`, `signal_source_suggestions` (`20260611180000_pause_first_legacy_settings_schema_cleanup.sql`). Per-user source toggles and admin suggestion queue no longer exist.

Query modules for dropped tables live under `queries/` in this legacy folder.

## Re-enabling

1. Restore tables/columns via migration.
2. Restore `companions` in `SETTINGS_SECTION_IDS` and Settings hub rows.
3. Wire `SettingsCompanionsLegacyPanel` into `SettingsSectionScreen`.
