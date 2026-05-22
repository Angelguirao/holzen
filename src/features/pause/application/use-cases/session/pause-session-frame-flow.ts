/**
 * CI cluster anchor for session frame ritual hydration (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-frame-cluster.ts` (empty export; unit-tested).
 * Use cases live in `ritual/frame/`; presentation frame I/O imports leaf modules (CI anchor only).
 */
export { initialFrameDoneFromRestored } from '../ritual/frame/restored-frame-ritual-state';
