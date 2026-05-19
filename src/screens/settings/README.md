# Settings screen

| Path | Role |
|------|------|
| `SettingsStateLayout.tsx` | Profile gate + `SettingsStateProvider` |
| `hooks/use-settings-model.ts` | Settings hub orchestration |
| `hooks/use-settings-state.ts` | Context consumer |
| `settings-context.tsx` | React context |
| `section-ids.ts` | Route section param types |
| `read-thrown-message.ts` | Auth error message helper |
| `components/` | Section panels, hub, email change |

`pages/settings/*` — thin re-exports and `SettingsSectionPage` route shell.
