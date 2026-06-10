import { describe, expect, it } from 'vitest';

import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry
} from '@/features/pause/domain/feel/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/feel/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi
} from '@/features/pause/domain/feel/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive } from '@/features/pause/domain/feel/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction
} from '@/features/pause/domain/feel/pause-session-chrome-close';
import { resolvePauseDepthContextLineParams } from '@/features/pause/domain/feel/resolve-pause-depth-context-line-params';
import { runDeepPausePickerEntryIfPro } from '@/features/pause/domain/feel/run-deep-pause-picker-entry-if-pro';

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
  runPauseSessionChromeCloseAction as runChromeCloseFromFlow
} from './pause-feel-flow';
import {
  runInitialEmotionSelect as runSelectDirect,
  runInitialEmotionSkip as runSkipDirect
} from './run-initial-emotion-log';
import {
  runInitialEmotionSelect as runSelectFromLogFlow,
  runInitialEmotionSkip as runSkipFromLogFlow
} from './pause-initial-emotion-log-flow';
import {
  initialEmotionResetUi as resetUiFromPresentationFlow,
  initialEmotionSelectRollbackUi as rollbackUiFromPresentationFlow
} from './pause-initial-emotion-presentation-flow';
import { buildFeelTilesMoodLogOptions as buildFeelTilesFromFeelTilesFlow } from './pause-feel-tiles-flow';
import {
  applyBriefDepthPickerRitualEntry as applyBriefFromDepthFlow,
  applyDeepDepthPickerRitualEntry as applyDeepFromDepthFlow,
  isPauseSessionDepthPickerActive as isDepthPickerActiveFromDepthFlow,
  resolvePauseDepthContextLineParams as resolveDepthContextFromDepthFlow
} from './pause-depth-picker-feel-flow';
import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromChromeFlow,
  runDeepPausePickerEntryIfPro as runDeepPickerFromChromeFlow,
  runPauseSessionChromeCloseAction as runChromeCloseFromChromeFlow
} from './pause-session-mood-chrome-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildHubLogBundleFromHubFlow,
  resolveShiftFrameHubDonePresentation as resolveHubPresentationFromHubFlow,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromHubFlow
} from '../reflect/hub/pause-reflect-hub-flow';
import {
  formatReinforcementQuoteFromSession as formatQuoteFromFlowsFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlowsFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlowsFlow,
} from '../reflect/flows/pause-reflect-flows-flow';
import {
  dismissOpenPauseHome as dismissFromGenerationFlow,
  openManualPauseFromHome as openManualFromGenerationFlow,
  reflectGenerationPrerequisite as prerequisiteFromGenerationFlow,
  runReflectGeneration as runReflectGenerationFromGenerationFlow
} from '../reflect/generation/pause-reflect-generation-flow';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferFlow,
  runAdoptPendingPauseOffer as runAdoptFromPendingOfferFlow,
  runDeclinePendingPauseOffer as runDeclineFromPendingOfferFlow
} from '../reflect/pending-offer/pause-reflect-pending-offer-flow';
import {
  startPauseReflectFrameFocusAmbience as startAmbienceFromAmbienceFlow,
  stopPauseReflectFrameFocusAmbience as stopAmbienceFromAmbienceFlow
} from '../reflect/ambience/pause-reflect-ambience-flow';

describe('pause-feel-flow', () => {
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

  it('sibling cluster: flows-flow exports stay distinct from mood umbrella exports', () => {
    expect(runInitialEmotionSelect).not.toBe(resolvePreflightFromFlowsFlow);
    expect(runInitialEmotionSkip).not.toBe(resolveAfterGenFromFlowsFlow);
    expect(runInitialEmotionSelect).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(buildFeelTilesFromFlow).not.toBe(formatQuoteFromFlowsFlow);
    expect(runChromeCloseFromFlow).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(applyBriefFromFlow).not.toBe(resolvePreflightFromFlowsFlow);
  });

  it('sibling cluster: generation-flow exports stay distinct from mood umbrella exports', () => {
    expect(runInitialEmotionSelect).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(runInitialEmotionSkip).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(buildFeelTilesFromFlow).not.toBe(openManualFromGenerationFlow);
    expect(buildFeelTilesFromFlow).not.toBe(dismissFromGenerationFlow);
    expect(runChromeCloseFromFlow).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(applyBriefFromFlow).not.toBe(prerequisiteFromGenerationFlow);
    expect(runInitialEmotionSelect).not.toBe(openManualFromGenerationFlow);
  });

  it('sibling cluster: pending-offer-flow exports stay distinct from mood umbrella exports', () => {
    expect(runInitialEmotionSelect).not.toBe(runAdoptFromPendingOfferFlow);
    expect(runInitialEmotionSkip).not.toBe(runDeclineFromPendingOfferFlow);
    expect(buildFeelTilesFromFlow).not.toBe(getDisplayFromPendingOfferFlow);
    expect(runChromeCloseFromFlow).not.toBe(runAdoptFromPendingOfferFlow);
    expect(applyBriefFromFlow).not.toBe(runDeclineFromPendingOfferFlow);
    // Full cross-umbrella pins: `pause-feel-pending-offer-flow-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-flow.test.ts` (mood-flow cluster).
   * Dedicated sibling file: `pause-reflect-ambience-feel-flow-sibling-parity.test.ts`
   * (+ presentation mirror under `presentation/reflect/ambience/`).
   */
  it('sibling cluster: ambience-flow exports stay distinct from mood umbrella exports', () => {
    expect(runInitialEmotionSelect).not.toBe(startAmbienceFromAmbienceFlow);
    expect(runInitialEmotionSkip).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(buildFeelTilesFromFlow).not.toBe(startAmbienceFromAmbienceFlow);
    expect(runChromeCloseFromFlow).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(applyBriefFromFlow).not.toBe(startAmbienceFromAmbienceFlow);
    // Full cross-flow pins: `pause-reflect-ambience-feel-flow-sibling-parity.test.ts`.
  });
});
