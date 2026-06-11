# Archive screen

| Path | Role |
|------|------|
| `ArchiveScreen.tsx` | Main tab route (Pauses + Echoes) — thin conductor |
| `hooks/use-archive-screen.ts` | URL segments, list query, pull-to-refresh |
| `lib/archive-screen-params.ts` | URL segment helpers |
| `@/features/pause/public-hooks` → `usePauseArchiveList` | Paginated pause/echo lists (`v_pause_archive_*`), newest-first |
| `@/features/pause/public-hooks` (`useCurrentPause`) | Open pause row for banners/cards |
| `components/` | Tab UI, pause cards |

**Legacy (not shipped):** user **Collections** in `@/legacy/archive-collections/`; archive **search / sort / tag filters** in `@/legacy/archive-search-sort/`.

Route entry: `ArchiveScreen.tsx` (lazy-loaded from `App.tsx`).
