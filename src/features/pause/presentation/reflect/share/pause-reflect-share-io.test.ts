import { describe, expect, it, vi } from 'vitest';

const runReflectionShareImageMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image')
    >();
    return {
      ...actual,
      runReflectionShareImage: runReflectionShareImageMock,
    };
  },
);

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import { pauseReflectGeneration } from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import { buildReflectionShareText, pauseReflectionShareImage } from './pause-reflect-share-io';

describe('pause-reflect-share-io', () => {
  it('delegates to runReflectionShareImage', async () => {
    runReflectionShareImageMock.mockResolvedValue('downloaded');

    await pauseReflectionShareImage('Stay calm.', 'ctx', 'haiku line');

    expect(runReflectionShareImageMock).toHaveBeenCalledWith(
      'Stay calm.',
      'ctx',
      'haiku line',
      undefined,
    );
  });

  it('sibling cluster: session reflect telemetry-io exports stay distinct from share-io', () => {
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('sibling cluster: flows-io exports stay distinct from share-io', () => {
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectOutcomeLog);
  });

  it('sibling cluster: generation-io exports stay distinct from share-io PNG orchestration', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseReflectGeneration);
    // Full cross-I/O pins: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: steps-io exports stay distinct from share-io', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectNoteUpdate);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectTagUpdate);
  });

  it('sibling cluster: ambience-io exports stay distinct from share-io', () => {
    expect(pauseReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionShareImage).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Full cross-I/O pins: `pause-reflect-share-ambience-io-sibling-parity.test.ts` and
    // `pause-reflect-ambience-share-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: hub-io exports stay distinct from share-io', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionShareImage).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(buildReflectionShareText).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildReflectionShareText).not.toBe(pauseShiftEmotionFrameHubDone);
    // Full cross-umbrella pins: `pause-reflect-hub-share-io-sibling-parity.test.ts`.
  });
});
