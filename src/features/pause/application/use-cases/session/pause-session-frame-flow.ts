/**
 * CI cluster anchor for session frame ritual hydration (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-frame-cluster.ts` (empty export; unit-tested).
 * Use cases live in `ritual/frame/`; presentation frame I/O imports leaf modules (CI anchor only).
 * Parity pins: `pause-session-frame-io.re-exports.test.ts` and `pause-session-frame-io-parity.test.ts`.
 */
export { initialFrameDoneFromRestored } from '../ritual/frame/restored-frame-ritual-state';
