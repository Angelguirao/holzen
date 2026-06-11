# Archive search, sort, and tab row probe (legacy)

Client-side **search**, **tag filters**, **sort modes** (newest / oldest / A–Z), and the **pauses-tab has-rows** count probe — **not shipped** in pause-first MVP Archive.

Moved from active `src/screens/archive/` and `src/features/pause/infrastructure/queries/archive/` per pause-first scope strip.

## Re-enabling

1. Wire search input, tag pills, sort toggle, and optional item counter back into `ArchiveScreen.tsx`.
2. Restore `listSort` on `usePauseArchiveList` and client `filterAndSortArchiveRows` in `use-archive-screen.ts`.
3. Import from `@/legacy/archive-search-sort/public` — active code must not import this path until product re-ships the UX.

## Still in active MVP

- Archive **Pauses** / **Echoes** tabs with fixed **newest-first** server ordering (`usePauseArchiveList`).
- All / Favorites scope pills on Pauses tab.
