import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  applyBriefDepthPickerRitualEntry as applyBriefDirect,
  applyDeepDepthPickerRitualEntry as applyDeepDirect,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions as buildFeelTilesDirect } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi as resetUiDirect,
  initialEmotionSelectRollbackUi as rollbackUiDirect,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive as isDepthPickerActiveDirect } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseDirect,
  runPauseSessionChromeCloseAction as runChromeCloseDirect,
} from '@/features/pause/domain/reflect/mood/pause-session-chrome-close';
import { runDeepPausePickerEntryIfPro as runDeepPickerDirect } from '@/features/pause/domain/reflect/mood/run-deep-pause-picker-entry-if-pro';
import { resolvePauseDepthContextLineParams as resolveDepthLineDirect } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
import {
  applyBriefDepthPickerRitualEntry as applyBriefFromMoodFlow,
  applyDeepDepthPickerRitualEntry as applyDeepFromMoodFlow,
  buildFeelTilesMoodLogOptions as buildFeelTilesFromMoodFlow,
  initialEmotionResetUi as resetUiFromMoodFlow,
  initialEmotionSelectRollbackUi as rollbackUiFromMoodFlow,
  isPauseSessionDepthPickerActive as isDepthPickerActiveFromMoodFlow,
  resolvePauseDepthContextLineParams as resolveDepthLineFromMoodFlow,
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromMoodFlow,
  runDeepPausePickerEntryIfPro as runDeepPickerFromMoodFlow,
  runPauseSessionChromeCloseAction as runChromeCloseFromMoodFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  isPauseSessionDepthPickerActive,
  reflectPauseRepository,
  resolvePauseDepthContextLineParams,
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from './pause-reflect-mood-io';

describe('pause-reflect-mood-io re-exports', () => {
  it('re-exports reflect mood helpers from domain leaf modules', () => {
    expect(typeof applyBriefDepthPickerRitualEntry).toBe('function');
    expect(typeof applyDeepDepthPickerRitualEntry).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof initialEmotionResetUi).toBe('function');
    expect(typeof initialEmotionSelectRollbackUi).toBe('function');
    expect(typeof isPauseSessionDepthPickerActive).toBe('function');
    expect(typeof resolvePauseDepthContextLineParams).toBe('function');
    expect(typeof resolvePauseSessionChromeCloseAction).toBe('function');
    expect(typeof runDeepPausePickerEntryIfPro).toBe('function');
    expect(typeof runPauseSessionChromeCloseAction).toBe('function');

    expect(applyBriefDepthPickerRitualEntry).toBe(applyBriefDirect);
    expect(applyDeepDepthPickerRitualEntry).toBe(applyDeepDirect);
    expect(buildFeelTilesMoodLogOptions).toBe(buildFeelTilesDirect);
    expect(initialEmotionResetUi).toBe(resetUiDirect);
    expect(initialEmotionSelectRollbackUi).toBe(rollbackUiDirect);
    expect(isPauseSessionDepthPickerActive).toBe(isDepthPickerActiveDirect);
    expect(resolvePauseDepthContextLineParams).toBe(resolveDepthLineDirect);
    expect(resolvePauseSessionChromeCloseAction).toBe(resolveChromeCloseDirect);
    expect(runDeepPausePickerEntryIfPro).toBe(runDeepPickerDirect);
    expect(runPauseSessionChromeCloseAction).toBe(runChromeCloseDirect);
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O bindings match pause-reflect-mood-flow CI anchor (leaf parity)', () => {
    expect(applyBriefDepthPickerRitualEntry).toBe(applyBriefFromMoodFlow);
    expect(applyDeepDepthPickerRitualEntry).toBe(applyDeepFromMoodFlow);
    expect(buildFeelTilesMoodLogOptions).toBe(buildFeelTilesFromMoodFlow);
    expect(initialEmotionResetUi).toBe(resetUiFromMoodFlow);
    expect(initialEmotionSelectRollbackUi).toBe(rollbackUiFromMoodFlow);
    expect(isPauseSessionDepthPickerActive).toBe(isDepthPickerActiveFromMoodFlow);
    expect(resolvePauseDepthContextLineParams).toBe(resolveDepthLineFromMoodFlow);
    expect(resolvePauseSessionChromeCloseAction).toBe(resolveChromeCloseFromMoodFlow);
    expect(runDeepPausePickerEntryIfPro).toBe(runDeepPickerFromMoodFlow);
    expect(runPauseSessionChromeCloseAction).toBe(runChromeCloseFromMoodFlow);
  });
});
