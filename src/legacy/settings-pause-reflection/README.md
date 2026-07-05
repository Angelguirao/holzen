# Settings pause reflection prefs (legacy)

Tone, style, and custom prompt controls from Settings → Pause behavior — **not shipped** in pause-first MVP.

Profile columns (`reflection_tone`, `reflection_style`, `custom_prompt`) were **dropped** in `20260611180000_pause_first_legacy_settings_schema_cleanup.sql`. Active reflect generation uses fixed defaults (`stoic` / `standard` / no custom prompt).

This module is UI reference only (local state, not persisted).

## Re-enabling

Would require restoring profile columns + wiring in `use-pause-reflect-generation` — not recommended without a product decision.
