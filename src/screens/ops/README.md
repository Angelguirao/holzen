# Internal ops screens

Admin-gated dev/ops routes. Not part of the pause-first product shell.

| Screen | Route |
|--------|-------|
| `SmokeTestScreen` | `/smoke-test` |
| `SentryAlertsScreen` | `/sentry-alerts` |
| `EdgeCoverageScreen` | `/edge-coverage` |

`App.tsx` lazy-loads `screens/ops/*` directly.
