# Settings screen

| Path | Role |
|------|------|
| `SettingsHubScreen.tsx` | Settings index route (hub list) |
| `SettingsSectionScreen.tsx` | Per-section route (`/:section`) |
| `SettingsStateLayout.tsx` | Profile gate + `SettingsStateProvider` |
| `hooks/use-settings-model.ts` | Settings hub orchestration |
| `hooks/use-settings-state.ts` | Context consumer |
| `settings-context.tsx` | React context |
| `section-ids.ts` | Route section param types |
| `read-thrown-message.ts` | Auth error message helper |
| `components/` | Section panels, hub UI, email change |
| `hooks/` | (none yet — shared hooks stay in `src/hooks/`) |

`pages/settings/*` — thin re-exports (`SettingsRoot`, `SettingsStateLayout`, `SettingsSectionPage`).
