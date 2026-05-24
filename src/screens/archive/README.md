# Archive screen

| Path | Role |
|------|------|
| `ArchiveScreen.tsx` | Main tab route (Pauses + Echoes) — thin conductor |
| `hooks/use-archive-screen.ts` | URL segments, list query, filters, pull-to-refresh |
| `lib/archive-list-filter.ts` | Pure search/tag/sort helpers |
| `@/features/pause/public-hooks` → `usePauseArchiveList` | Paginated pause/echo lists (`v_pause_archive_*`) |
| `@/features/pause/public-hooks` (`useCurrentPause`) | Open pause row for banners/cards |
| `components/` | Tab UI, filters, pause cards |

User **Collections** UI lives in `@/legacy/archive-collections/` (not MVP).

Route entry: `ArchiveScreen.tsx` (lazy-loaded from `App.tsx`).
