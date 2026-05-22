/**
 * Presentation I/O for `/pause` frame ritual hydration from `PersistedSession`.
 * Imports `ritual/frame/restored-frame-ritual-state` directly (parity with
 * `pause-session-ritual-restore-io`; not `pause-session-frame-flow` CI anchor).
 */
export { initialFrameDoneFromRestored } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';
