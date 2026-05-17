# Bruno — full-IA reference (not shipped)

Requests here exercised the **pre–pause-first** product (Tools, Journey stats, badges, digests, library ingest, etc.). They are kept for recovery against tag **`full-ia-pre-strip`**, not for day-to-day MVP review.

**Against production after MVP deploy:** many of these Edge Functions are **undeployed** or **cron-unscheduled** — expect **404** or no-op schedules.

**Default HTTP review:** use **[`../../active/`](../../active/)** and [`../../active/functions-catalog.md`](../../active/functions-catalog.md).

| Folder | Why legacy |
| --- | --- |
| `user-jwt/` | Badge, journal, insights, wallpaper, suggest-* (undeployed edges) |
| `service-cron/` | Weekly digest, night reflection, letters, fetch-source-feeds, … (crons off at cutover) |
