# Marketing / public screens

Public routes (no auth shell). Shared marketing chrome: `components/PublicFooter.tsx`. Other section components under `components/`.

| `hooks/` | Route conductors (`use-auth-screen`, `use-reset-password-screen`, `use-unsubscribe-screen`) |

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
| ~~`RoadmapScreen`~~ | `/roadmap` — **legacy** (`src/legacy/marketing-roadmap-reserve/`) |
| ~~`ReserveScreen`~~ | `/reserve` — **legacy** (`src/legacy/marketing-roadmap-reserve/`) |
| `UnsubscribeScreen` | `/unsubscribe` |

`App.tsx` lazy-loads `screens/marketing/*Screen` directly.

Internal ops routes live under [`screens/ops/`](../ops/README.md).
