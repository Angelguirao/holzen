/**
 * Presentation I/O for `/pause` frame ritual hydration from `PersistedSession`.
 * Imports `ritual/frame/restored-frame-ritual-state` directly (parity with
 * `pause-session-ritual-restore-io`; not `pause-session-frame-flow` CI anchor).
 * Parity pins: `pause-session-frame-io.re-exports.test.ts`, `pause-session-frame-io-parity.test.ts`, and `pause-session-ritual-restore-frame-io-sibling-parity.test.ts` (shared `initialFrameDoneFromRestored` binding with `pause-session-ritual-restore-io`).
 */
export { initialFrameDoneFromRestored } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';
