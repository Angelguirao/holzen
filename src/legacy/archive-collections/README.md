# Archive user collections (legacy)

User-defined **Collections** tab and `collections` / `collection_items` client code — **not shipped** in pause-first MVP.

**Postgres:** `collections` / `collection_items` **dropped** in `20260604120000_pause_first_zombie_schema_cleanup.sql`. Re-enabling requires restoring those tables from migration history before wiring UI back.

Moved from active `src/features/pause/` and `src/screens/archive/` per [docs/systems/pause-client-architecture.md](../../../docs/systems/pause-client-architecture.md) §7.

## Still in active MVP

- Archive **Pauses** / **Echoes** tabs (`usePauseArchiveList`, `v_pause_archive_*`)
- `companion_catalog` and `useCompanionLibraryFavorites` (slot hearts — not user collections)

## Re-enabling

Wire `ArchiveCollectionsSection` back into `ArchiveScreen` and restore exports only after product re-ships collections. Legacy may import active components (e.g. `ArchivePauseCard`); active code must not import `@/legacy/archive-collections/**`.
