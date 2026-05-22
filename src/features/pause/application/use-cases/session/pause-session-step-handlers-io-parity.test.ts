import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import {
  buildPauseSessionStepRitualBundle as buildRitualFromLeaf,
  buildPauseSessionStepShellBundle as buildShellFromLeaf,
} from '@/features/pause/application/use-cases/session/step-bundles';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/application/use-cases/session/pause-session-step-handlers-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromStepHandlersIo,
  buildPauseSessionStepShellBundle as buildShellFromStepHandlersIo,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

describe('pause-session-step-handlers-io parity', () => {
  it('presentation I/O bundle builders match step-handlers CI umbrella', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromStepHandlersIo);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromStepHandlersIo);
  });

  it('step-handlers CI umbrella composes the same step-bundles leaf as presentation I/O', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (session bundles vs reflect RPC).
   * Dedicated sibling file: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` (application);
   * presentation mirror: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` under `presentation/session/`.
   */
  it('sibling cluster: reflect steps-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectTagUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectNoteUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectFavoriteToggle);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectionStepLogOnce);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(buildPauseSessionStepShellBundle).not.toBe(shouldShowFavoriteProHint);
    expect(buildPauseSessionStepRitualBundle).not.toBe(shouldLogPauseReflectionStep);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectFavoriteToggleWithRepository);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });
});
