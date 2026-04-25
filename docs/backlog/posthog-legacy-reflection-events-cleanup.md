# PostHog: remove legacy `reflection.*` event data and update insights

**Status:** Open. **Code is done** — the app only emits `pause.manual_started` and `pause.manual_completed` for the Home manual + `holzen-reflect` flow (see `docs/ops/event-taxonomy.md`). This ticket is **PostHog project settings / dashboards**, not a git change.

## Why

`reflection.started` and `reflection.completed` were pre–Pause-V2 names. New traffic no longer uses them. PostHog may still have historical rows and any insights or dashboards that reference the old event names will show **stale or empty** series unless updated.

## What to do (PostHog project)

1. **Data / definitions** (PostHog → **Data management** or **Project settings** → events — exact UI path varies by PostHog version): review legacy **`reflection.started`** and **`reflection.completed`**. Prefer **archiving** or **hiding** unused definitions, or follow PostHog’s current flow to **delete** stored historical event data for those event names if you no longer need them for analysis.
2. **Insights & dashboards** that filter on `reflection.started` / `reflection.completed` → update to **`pause.manual_started`** and **`pause.manual_completed`**, and re-save or duplicate dashboards as needed.
3. **Optional:** add a one-line note in the team runbook (or leave this ticket closed) when cleanup is done so no one re-adds the old names in the UI.

## Related docs

- `docs/ops/event-taxonomy.md` — canonical event names and properties.
- `docs/ops/observability-setup.md` — example funnels use `pause.manual_*`.
