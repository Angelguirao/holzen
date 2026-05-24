# Settings screen

| Path | Role |
|------|------|
| `SettingsHubScreen.tsx` | Settings index route (hub list) |
| `SettingsSectionScreen.tsx` | Per-section route (`/:section`) |
| `SettingsAboutScreen.tsx` | About, changelog, feedback (`/settings/about`) |
| `BillingHistoryScreen.tsx` | Stripe billing history (`/settings/billing-history`) |
| `SettingsRoot.tsx` | Pathless outlet for `/settings/*` |
| `SettingsStateLayout.tsx` | Profile gate + `SettingsStateProvider` |
| `hooks/use-settings-model.ts` | Settings hub orchestration (composes local prefs, checkout window, auto-save) |
| `hooks/use-settings-local-prefs.ts` | Haptic, sound, BTC display mode (localStorage) |
| `hooks/use-settings-checkout-window.ts` | Checkout suppression window (subscription public API) |
| `hooks/use-settings-state.ts` | Context consumer |
| `settings-context.tsx` | React context |
| `section-ids.ts` | Route section param types |
| Account/credential actions | `@/features/auth/public`, `@/features/user/public` (presentation I/O barrels) |
| `components/` | Section panels, hub UI, email change |
| `hooks/` | `use-settings-model.ts`, `use-latest-changelog-version.ts`; auth/subscription via `@/features/*/public` and `public-hooks` |

`App.tsx` lazy-loads `SettingsSectionScreen`, `BillingHistoryScreen`, etc. from this folder.
