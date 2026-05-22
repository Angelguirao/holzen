import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
  buildFeelTilesMoodLogOptions,
  applyBriefDepthPickerRitualEntry,
  resolvePauseSessionChromeCloseAction,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow';
import * as moodFlow from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow';

/**
 * Presentation mirror of application flow sibling parity (CI anchors only — production I/O
 * uses `pause-reflect-ambience-io` / `pause-reflect-mood-io` leaf bindings).
 * Application source: `application/.../ambience/pause-reflect-ambience-mood-flow-sibling-parity.test.ts`.
 * Mood-anchored mirror: `application/.../mood/pause-reflect-mood-ambience-flow-sibling-parity.test.ts` (if present).
 * I/O sibling: `pause-reflect-ambience-mood-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-mood-flow sibling parity (presentation)', () => {
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

  it('frame-focus ambience exports stay off initial-emotion log and mood domain helpers', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runInitialEmotionSelect);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runInitialEmotionSkip);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildFeelTilesMoodLogOptions);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(applyBriefDepthPickerRitualEntry);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionChromeCloseAction);
  });

  it('mood-flow exports stay off Web Audio frame-focus bed start/stop', () => {
    expect(runInitialEmotionSelect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runInitialEmotionSkip).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesMoodLogOptions).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(resolvePauseSessionChromeCloseAction).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runInitialEmotionSelect).not.toBe(runInitialEmotionSkip);
  });
});
