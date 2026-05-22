/**
 * Session presentation I/O for decide outcome impact types (ritual state, step bundles).
 * Imports `PauseImpactData` from domain directly (parity with manual-open and generation I/O peels;
 * not session decide-flow CI anchor).
 */
export type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
