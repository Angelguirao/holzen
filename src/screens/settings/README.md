# Settings screen

| Path | Role |
|------|------|
| `SettingsHubScreen.tsx` | Settings index route (hub list) |
| `SettingsSectionScreen.tsx` | Per-section route (`/:section`) |
| `SettingsAboutScreen.tsx` | About, changelog, feedback (`/settings/about`) |
| `BillingHistoryScreen.tsx` | Stripe billing history (`/settings/billing-history`) |
| `SettingsRoot.tsx` | Pathless outlet for `/settings/*` |
| `SettingsStateLayout.tsx` | Profile gate + `SettingsStateProvider` |
| `hooks/use-settings-model.ts` | Settings hub orchestration |
| `hooks/use-settings-state.ts` | Context consumer |
| `settings-context.tsx` | React context |
| `section-ids.ts` | Route section param types |
| `read-thrown-message.ts` | Auth error message helper |
| `components/` | Section panels, hub UI, email change |
| `hooks/` | Screen-local hooks colocated under other screens; settings uses shared `src/hooks/` for auth/subscription |

`pages/settings/SettingsSectionPage.tsx` — thin re-export only. `pages/BillingHistory.tsx` → `BillingHistoryScreen`.
