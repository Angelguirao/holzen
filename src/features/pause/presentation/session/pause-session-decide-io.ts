/**
 * Session presentation I/O for decide outcome impact types (ritual state, step bundles).
 * Imports `PauseImpactData` from domain directly (parity with manual-open and generation I/O peels;
 * not session decide-flow CI anchor).
 * Parity pins: `pause-session-decide-io.test.ts`, `pause-session-decide-io-parity.test.ts`,
 * `pause-session-decide-io.re-exports.test.ts`, and
 * `pause-reflect-flows-decide-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io` (hydration
 * pins import `pause-session-decide-flow`; decide-io stays type-only).
 */
export type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
