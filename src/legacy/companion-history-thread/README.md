# Companion history thread (quarantined)

**Not shipped** in pause-first UI. Full View pages no longer list the user's last few cards of the same companion type.

## What it was

- **`HistoryThread`** — "Your recent Signal / Grounding / Look Back / Zoom Out cards" footer on `/companion/*/:pauseInstanceId` pages.
- Reads **`pause_ai_artifacts`** via `fetchHistoryThreadRows`, excluding the current pause instance.

## Code map

| Layer | Location |
|-------|----------|
| UI | `HistoryThread.tsx` |
| Hook | `use-companion-history-thread.ts` |
| Query | `history-thread-query.ts` |
| Date label | `format-companion-history-relative-day.ts` |

**Active `src/` must not import `@/legacy/**`.** Re-enable by wiring `HistoryThread` back into companion Full View pages and re-exporting from `public-ritual-frame` / `public-queries`.
