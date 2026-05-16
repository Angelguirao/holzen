# Active surface manifest (pause-first MVP)

**Status:** Step 2 stub — complete in Step 5 after DB/edge cutover.

**Recovery:** Full pre-strip snapshot: git tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`.

## Shipped client routes (authenticated shell)

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/archive` | Archive |
| `/journey` | Journey overview |
| `/settings` | Settings hub + sections |

**Full-screen (no bottom nav):** `/pause`, `/companion/*`

**Dead IA (404 only):** `/tools`, `/tools/*`, `/library`, `/journey/stats`, `/journey/:tab`, …

## Deployed edges

See Step 5 — MVP list in pause-first plan §17.1.

## PostHog (shipped)

| Event | When |
| --- | --- |
| `app.route_not_found` | NotFound for unknown path |
| `journey.overview_viewed` | Journey overview mount |

Full taxonomy: [event-taxonomy.md](./event-taxonomy.md).
