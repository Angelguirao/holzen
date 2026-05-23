import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import {
  applyBriefDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  resolvePauseSessionChromeCloseAction,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/feel/pause-feel-flow';
import * as moodFlow from '@/features/pause/application/use-cases/ritual/feel/pause-feel-flow';
import {
  applyBriefDepthPickerRitualEntry as applyBriefFromMoodIo,
  buildFeelTilesMoodLogOptions as buildFeelTilesFromMoodIo,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository,
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromMoodIo,
} from './pause-feel-io';
import * as moodIo from './pause-feel-io';

/**
 * Presentation sibling parity: mood-flow CI umbrella vs mood-io port-bound wrappers.
 * Mirrors application `pause-feel-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-feel-flow.ts`).
 * Delegation parity: colocated `pause-feel-io-parity.test.ts`.
 */
describe('pause-feel-flow ↔ pause-feel-io wrapper sibling parity (presentation)', () => {
  it('mood-flow CI umbrella and presentation mood-io are distinct anchors', () => {
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in moodFlow).toBe(false);
    expect('pauseInitialEmotionSkip' in moodFlow).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in moodFlow).toBe(false);
    expect('reflectPauseRepository' in moodFlow).toBe(false);
    expect('pauseInitialEmotionSelect' in moodIo).toBe(true);
    expect('pauseInitialEmotionSkipWithRepository' in moodIo).toBe(true);
  });

  it('presentation mood-io re-exports domain mood helpers from mood-flow CI umbrella', () => {
    expect(buildFeelTilesFromMoodIo).toBe(buildFeelTilesMoodLogOptions);
    expect(applyBriefFromMoodIo).toBe(applyBriefDepthPickerRitualEntry);
    expect(resolveChromeCloseFromMoodIo).toBe(resolvePauseSessionChromeCloseAction);
    expect('runInitialEmotionSelect' in moodIo).toBe(false);
    expect('runInitialEmotionSkip' in moodIo).toBe(false);
  });

  it('mood-flow umbrella exports stay off presentation port-bound wrappers', () => {
    expect(runInitialEmotionSelect).not.toBe(pauseInitialEmotionSelect);
    expect(runInitialEmotionSkip).not.toBe(pauseInitialEmotionSkip);
    expect(runInitialEmotionSelect).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(reflectPauseRepository);
  });

  it('presentation mood-io wrappers stay off mood-flow leaf re-exports', () => {
    expect(pauseInitialEmotionSelect).not.toBe(runInitialEmotionSelect);
    expect(pauseInitialEmotionSkip).not.toBe(runInitialEmotionSkip);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(runInitialEmotionSkip);
    expect(reflectPauseRepository).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseInitialEmotionSkip).not.toBe(applyBriefDepthPickerRitualEntry);
  });
});
