import { mapPersistedStep } from '@/features/pause/domain/session/map-persisted-step';

export { mapPersistedStep };

/**
 * Pause route helpers: map persisted step strings from local storage.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Brief ritual restore:** `application/use-cases/ritual/reflect/scaffold/restored-brief-ritual-state.ts`.
 * **Breath ritual restore:** `application/use-cases/ritual/breathe/restored-breath-ritual-state.ts`.
 * **Frame ritual restore:** `application/use-cases/ritual/frame/restored-frame-ritual-state.ts`.
 * **Decide / Done restore:** `application/use-cases/ritual/decide/restored-decide-ritual-state.ts`.
 * **Depth picker entry:** `application/use-cases/ritual/reflect/scaffold/initial-ritual-entry.ts`.
 * **Ritual sync caveat:** `computePauseStorageRitualSyncPatch` in `application/use-cases/ritual/reflect/scaffold/storage-ritual-sync.ts`.
 * **Code map:** same pause doc, section 10 (Related docs and code).
 */
