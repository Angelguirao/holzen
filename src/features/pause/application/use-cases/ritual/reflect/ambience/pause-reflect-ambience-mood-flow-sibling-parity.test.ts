import { describe, expect, it } from 'vitest';

import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
  buildFeelTilesMoodLogOptions,
  applyBriefDepthPickerRitualEntry,
  resolvePauseSessionChromeCloseAction,
} from '../mood/pause-reflect-mood-flow';
import * as moodFlow from '../mood/pause-reflect-mood-flow';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-flow';
import * as ambienceFlow from './pause-reflect-ambience-flow';

/**
 * Sibling parity: ambience-flow vs mood-flow CI anchors (parity with
 * `pause-reflect-ambience-generation-flow-sibling-parity.test.ts` and
 * `pause-reflect-mood-pending-offer-flow-sibling-parity.test.ts`).
 * Presentation mirror: `presentation/reflect/ambience/pause-reflect-ambience-mood-flow-sibling-parity.test.ts`.
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-mood-flow sibling parity', () => {
  it('ambience-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof applyBriefDepthPickerRitualEntry).toBe('function');
    expect(typeof resolvePauseSessionChromeCloseAction).toBe('function');

    expect('runInitialEmotionSelect' in ambienceFlow).toBe(false);
    expect('runInitialEmotionSkip' in ambienceFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in ambienceFlow).toBe(false);
    expect('applyBriefDepthPickerRitualEntry' in ambienceFlow).toBe(false);
    expect('resolvePauseSessionChromeCloseAction' in ambienceFlow).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in moodFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in moodFlow).toBe(false);
  });

  it('ambience-flow exports stay off initial-emotion log and mood domain helpers', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runInitialEmotionSelect);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runInitialEmotionSkip);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildFeelTilesMoodLogOptions);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(applyBriefDepthPickerRitualEntry);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionChromeCloseAction);
  });

  it('mood-flow exports stay off frame-focus ambience bed start/stop', () => {
    expect(runInitialEmotionSelect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runInitialEmotionSkip).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesMoodLogOptions).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(resolvePauseSessionChromeCloseAction).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runInitialEmotionSelect).not.toBe(runInitialEmotionSkip);
  });
});
