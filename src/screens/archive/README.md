# Archive screen

| Path | Role |
|------|------|
| `ArchiveScreen.tsx` | Main tab route (Pauses + Echoes) |
| `@/features/pause/public-hooks` → `usePauseArchiveList` | Paginated pause/echo lists (`v_pause_archive_*`) |
| `@/features/pause/public-hooks` (`useCurrentPause`) | Open pause row for banners/cards |
| `components/` | Tab UI, filters, pause cards |

User **Collections** UI lives in `@/legacy/archive-collections/` (not MVP).

Thin page: `pages/Archive.tsx` → `ArchiveScreen`.
