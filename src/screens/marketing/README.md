# Marketing / public screens

Public routes (no auth shell). Landing section components live under `components/`.

| Screen | Route |
|--------|-------|
| `LandingScreen` | `/welcome` (and public entry) |
| `AuthScreen` | `/auth` |
| `AboutScreen` | `/about` |
| `TermsScreen` | `/terms` |
| `PrivacyScreen` | `/privacy` |
| `ResetPasswordScreen` | `/reset-password` |
| `NotFoundScreen` | `*` catch-all |
| `BlogScreen` | `/blog` |
| `BlogPostScreen` | `/blog/:slug` |
| `RoadmapScreen` | `/roadmap` |
| `ReserveScreen` | `/reserve` |
| `UnsubscribeScreen` | `/unsubscribe` |

`pages/*.tsx` — thin re-exports for Lovable/route stability. `App.tsx` lazy-loads `screens/marketing/*Screen` directly.

**Still in `pages/`:** internal ops (`SmokeTest`, `SentryAlerts`, `EdgeCoverage`).
