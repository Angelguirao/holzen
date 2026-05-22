import { describe, expect, it } from 'vitest';

import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
} from '@/features/pause/domain/reflect/mood/pause-session-chrome-close';
import { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
import { runDeepPausePickerEntryIfPro } from '@/features/pause/domain/reflect/mood/run-deep-pause-picker-entry-if-pro';

import {
  applyBriefDepthPickerRitualEntry as applyBriefFromFlow,
  applyDeepDepthPickerRitualEntry as applyDeepFromFlow,
  buildFeelTilesMoodLogOptions as buildFeelTilesFromFlow,
  initialEmotionResetUi as resetUiFromFlow,
  initialEmotionSelectRollbackUi as rollbackUiFromFlow,
  isPauseSessionDepthPickerActive as isDepthPickerActiveFromFlow,
  resolvePauseDepthContextLineParams as resolveDepthContextFromFlow,
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromFlow,
  runDeepPausePickerEntryIfPro as runDeepPickerFromFlow,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
  runPauseSessionChromeCloseAction as runChromeCloseFromFlow,
} from './pause-reflect-mood-flow';
import {
  runInitialEmotionSelect as runSelectDirect,
  runInitialEmotionSkip as runSkipDirect,
} from './run-initial-emotion-log';
import {
  runInitialEmotionSelect as runSelectFromLogFlow,
  runInitialEmotionSkip as runSkipFromLogFlow,
} from './pause-initial-emotion-log-flow';
import {
  initialEmotionResetUi as resetUiFromPresentationFlow,
  initialEmotionSelectRollbackUi as rollbackUiFromPresentationFlow,
} from './pause-initial-emotion-presentation-flow';
import { buildFeelTilesMoodLogOptions as buildFeelTilesFromFeelTilesFlow } from './pause-feel-tiles-mood-flow';
import {
  applyBriefDepthPickerRitualEntry as applyBriefFromDepthFlow,
  applyDeepDepthPickerRitualEntry as applyDeepFromDepthFlow,
  isPauseSessionDepthPickerActive as isDepthPickerActiveFromDepthFlow,
  resolvePauseDepthContextLineParams as resolveDepthContextFromDepthFlow,
} from './pause-depth-picker-mood-flow';
import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromChromeFlow,
  runDeepPausePickerEntryIfPro as runDeepPickerFromChromeFlow,
  runPauseSessionChromeCloseAction as runChromeCloseFromChromeFlow,
} from './pause-session-mood-chrome-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildHubLogBundleFromHubFlow,
  resolveShiftFrameHubDonePresentation as resolveHubPresentationFromHubFlow,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromHubFlow,
} from '../hub/pause-reflect-hub-flow';

describe('pause-reflect-mood-flow', () => {
  it('re-exports mood helpers from domain + run-initial-emotion-log leaf module', () => {
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesFromFlow).toBe('function');
    expect(typeof isDepthPickerActiveFromFlow).toBe('function');
    expect(typeof applyBriefFromFlow).toBe('function');
    expect(typeof applyDeepFromFlow).toBe('function');
    expect(typeof resolveDepthContextFromFlow).toBe('function');
    expect(typeof resetUiFromFlow).toBe('function');
    expect(typeof rollbackUiFromFlow).toBe('function');
    expect(typeof resolveChromeCloseFromFlow).toBe('function');
    expect(typeof runChromeCloseFromFlow).toBe('function');
    expect(typeof runDeepPickerFromFlow).toBe('function');

    expect(runInitialEmotionSelect).toBe(runSelectDirect);
    expect(runInitialEmotionSkip).toBe(runSkipDirect);
    expect(buildFeelTilesFromFlow).toBe(buildFeelTilesMoodLogOptions);
    expect(isDepthPickerActiveFromFlow).toBe(isPauseSessionDepthPickerActive);
    expect(applyBriefFromFlow).toBe(applyBriefDepthPickerRitualEntry);
    expect(applyDeepFromFlow).toBe(applyDeepDepthPickerRitualEntry);
    expect(resolveDepthContextFromFlow).toBe(resolvePauseDepthContextLineParams);
    expect(resetUiFromFlow).toBe(initialEmotionResetUi);
    expect(rollbackUiFromFlow).toBe(initialEmotionSelectRollbackUi);
    expect(resolveChromeCloseFromFlow).toBe(resolvePauseSessionChromeCloseAction);
    expect(runChromeCloseFromFlow).toBe(runPauseSessionChromeCloseAction);
    expect(runDeepPickerFromFlow).toBe(runDeepPausePickerEntryIfPro);
  });

  it('umbrella bindings match mood subcluster CI anchors (domain leaf parity)', () => {
    expect(runInitialEmotionSelect).toBe(runSelectFromLogFlow);
    expect(runInitialEmotionSkip).toBe(runSkipFromLogFlow);
    expect(buildFeelTilesFromFlow).toBe(buildFeelTilesFromFeelTilesFlow);
    expect(isDepthPickerActiveFromFlow).toBe(isDepthPickerActiveFromDepthFlow);
    expect(applyBriefFromFlow).toBe(applyBriefFromDepthFlow);
    expect(applyDeepFromFlow).toBe(applyDeepFromDepthFlow);
    expect(resolveDepthContextFromFlow).toBe(resolveDepthContextFromDepthFlow);
    expect(resetUiFromFlow).toBe(resetUiFromPresentationFlow);
    expect(rollbackUiFromFlow).toBe(rollbackUiFromPresentationFlow);
    expect(resolveChromeCloseFromFlow).toBe(resolveChromeCloseFromChromeFlow);
    expect(runChromeCloseFromFlow).toBe(runChromeCloseFromChromeFlow);
    expect(runDeepPickerFromFlow).toBe(runDeepPickerFromChromeFlow);
  });

  it('sibling cluster: hub-flow exports stay distinct from mood umbrella exports', () => {
    expect(runInitialEmotionSelect).not.toBe(buildHubLogBundleFromHubFlow);
    expect(runInitialEmotionSelect).not.toBe(runShiftHubDoneFromHubFlow);
    expect(buildFeelTilesFromFlow).not.toBe(buildHubLogBundleFromHubFlow);
    expect(buildFeelTilesFromFlow).not.toBe(resolveHubPresentationFromHubFlow);
    expect(runChromeCloseFromFlow).not.toBe(runShiftHubDoneFromHubFlow);
    expect(applyBriefFromFlow).not.toBe(resolveHubPresentationFromHubFlow);
  });
});
