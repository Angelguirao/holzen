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
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  isPauseSessionDepthPickerActive,
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
});
