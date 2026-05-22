import { describe, expect, it } from 'vitest';
import {
  computePauseSessionHydration as computeHydrationFromShellIo,
  hasPersistedPauseSessionPayload as hasPersistedFromShellIo,
} from '@/features/pause/presentation/session/pause-session-shell-io';
import { buildPauseSessionPersistSnapshot as buildPersistFromLeaf } from '@/features/pause/application/use-cases/session/persist-snapshot';
import { buildPauseSessionScaffoldRitualDerived as buildDerivedFromLeaf } from '@/features/pause/application/use-cases/session/scaffold/scaffold-ritual-derived';
import { computePauseStorageRitualSyncPatch as computeSyncFromLeaf } from '@/features/pause/application/use-cases/session/storage-ritual-sync';
import { hasPersistablePauseSessionAnchor as hasAnchorFromDomain } from '@/features/pause/domain/session/persisted-session-guards';
import { pickPauseHolzenProvidersSlice } from '@/features/pause/presentation/session/pause-session-providers-io';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './pause-session-scaffold-io';

describe('pause-session-scaffold-io', () => {
  it('re-exports persist snapshot builder from persist-snapshot', () => {
    const snapshot = buildPauseSessionPersistSnapshot({
      message: 'm',
      context: null,
      pauseInstanceId: 'pi-1',
      companions: { haiku: null, groundingTitle: null, groundingBody: null },
      companionPrefs: {
        breathing: true,
        haiku: true,
        grounding: true,
        signal: true,
        zoomOut: true,
        history: true,
      },
      severity: 'mild',
      moodDone: false,
      moodAfterDone: false,
      selectedMood: null,
      selectedMoodAfter: null,
      feelIntensity: null,
      shiftIntensity: null,
      phase: 'session',
      decision: null,
      step: 'reflect',
      breathingFirstCompleted: false,
      breathingSecondCompleted: false,
      frameDone: false,
      ritualEntry: 'deep',
      briefStep: 'feel',
      briefIntegrateDone: false,
      selectedBriefFace: null,
    });

    expect(snapshot.pauseInstanceId).toBe('pi-1');
    expect(snapshot.step).toBe('reflect');
  });

  it('re-exports storage ritual sync patch helper from storage-ritual-sync', () => {
    const patch = computePauseStorageRitualSyncPatch('pi-1', null);
    expect(patch).not.toBeNull();
    expect(patch!.ritualEntry).toBe('picker');
    expect(patch!.briefStep).toBe('feel');
  });

  it('re-exports scaffold ritual derived builder from scaffold-ritual-derived', () => {
    const derived = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'reflect',
      t: (key: string) => key,
    });

    expect(derived.macroProgressLine).toBeDefined();
  });

  it('re-exports persistable session anchor guard from domain persisted-session-guards', () => {
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');
    expect(hasPersistablePauseSessionAnchor('pi-1', '')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, 'copy')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, '   ')).toBe(false);
    expect(hasPersistablePauseSessionAnchor).toBe(hasAnchorFromDomain);
  });

  it('presentation I/O re-exports match application leaf modules (direct re-export parity)', () => {
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistFromLeaf);
    expect(computePauseStorageRitualSyncPatch).toBe(computeSyncFromLeaf);
    expect(buildPauseSessionScaffoldRitualDerived).toBe(buildDerivedFromLeaf);
  });

  it('sibling cluster: shell-io exports stay distinct from scaffold-io re-exports', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(computeHydrationFromShellIo);
    expect(computePauseStorageRitualSyncPatch).not.toBe(computeHydrationFromShellIo);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(computeHydrationFromShellIo);
    expect(hasPersistablePauseSessionAnchor).not.toBe(computeHydrationFromShellIo);
    expect(hasPersistablePauseSessionAnchor).not.toBe(hasPersistedFromShellIo);
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-terminal-entry-io.test.ts` (scaffold persist vs terminal guards).
   * Dedicated sibling file: `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: terminal-entry-io exports stay distinct from scaffold-io', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(isTerminalPauseDbState);
    expect(computePauseStorageRitualSyncPatch).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(hasPersistablePauseSessionAnchor).not.toBe(isTerminalPauseDbState);
    // Reciprocal inline pins: `pause-session-terminal-entry-io.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io.test.ts` (scaffold-io cluster).
   * Dedicated sibling file: `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-handlers-io exports stay distinct from scaffold-io', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(buildPauseSessionStepShellBundle);
    expect(computePauseStorageRitualSyncPatch).not.toBe(buildPauseSessionStepRitualBundle);
    // Full cross-I/O pins: `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-providers-io.test.ts`.
   * Dedicated sibling file: `pause-session-providers-scaffold-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: providers-io exports stay distinct from scaffold-io', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseStorageRitualSyncPatch).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistablePauseSessionAnchor).not.toBe(pickPauseHolzenProvidersSlice);
  });
});
