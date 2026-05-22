import { describe, expect, it } from 'vitest';

import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';

import {
  runPauseFavoriteToggle as runFavoriteFromFavoriteFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromFavoriteFlow,
} from './pause-favorite-toggle-flow';
import {
  runPauseReflectNoteUpdate as runNoteFromNoteFlow,
} from './pause-reflect-note-flow';
import {
  runPauseReflectTagUpdate as runTagFromTagFlow,
} from './pause-reflect-tag-flow';
import {
  runPauseReflectionStepLogOnce as runReflectionStepFromLogFlow,
  shouldLogPauseReflectionStep as shouldLogFromLogFlow,
} from './pause-reflection-step-log-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep as shouldLogFromFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromFlow,
} from './pause-reflect-steps-flow';
import { runPauseFavoriteToggle as runFavoriteDirect } from './run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteDirect } from './run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagDirect } from './run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepDirect } from './run-pause-reflection-step-log';
import {
  dismissOpenPauseHome as dismissFromGenerationFlow,
  messageFromReflectGenerationResult as messageFromResultFromGenerationFlow,
  openManualPauseFromHome as openManualFromGenerationFlow,
  reflectGenerationPrerequisite as prerequisiteFromGenerationFlow,
  runReflectGeneration as runReflectGenerationFromGenerationFlow,
  shouldCommitReflectGeneration as shouldCommitFromGenerationFlow,
} from '../generation/pause-reflect-generation-flow';
import {
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlowsFlow,
} from '../flows/pause-reflect-flows-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildHubLogBundleFromHubFlow,
  resolveShiftFrameHubDonePresentation as resolveHubPresentationFromHubFlow,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromHubFlow,
} from '../hub/pause-reflect-hub-flow';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferFlow,
  runAdoptPendingPauseOffer as runAdoptFromPendingOfferFlow,
  runDeclinePendingPauseOffer as runDeclineFromPendingOfferFlow,
  trackPausePendingAdopted as trackAdoptedFromPendingOfferFlow,
  trackPausePendingDeclined as trackDeclinedFromPendingOfferFlow,
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferFlow,
} from '../pending-offer/pause-reflect-pending-offer-flow';
import {
  buildReflectionShareText as buildShareTextFromShareFlow,
  runReflectionShareImage as runShareImageFromShareFlow,
  trackPauseReflectShareTap as trackShareTapFromShareFlow,
} from '../share/pause-reflect-share-flow';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '../telemetry/pause-reflect-telemetry-flow';
import {
  startPauseReflectFrameFocusAmbience as startAmbienceFromAmbienceFlow,
  stopPauseReflectFrameFocusAmbience as stopAmbienceFromAmbienceFlow,
} from '../ambience/pause-reflect-ambience-flow';

describe('pause-reflect-steps-flow', () => {
  it('re-exports step mutations and domain gates from leaf modules', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteFromFlow).toBe('function');
    expect(typeof shouldLogFromFlow).toBe('function');

    expect(runPauseFavoriteToggle).toBe(runFavoriteDirect);
    expect(runPauseReflectNoteUpdate).toBe(runNoteDirect);
    expect(runPauseReflectTagUpdate).toBe(runTagDirect);
    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepDirect);
    expect(shouldShowFavoriteFromFlow).toBe(shouldShowFavoriteProHint);
    expect(shouldLogFromFlow).toBe(shouldLogPauseReflectionStep);
  });

  it('umbrella bindings match steps subcluster CI anchors (leaf parity)', () => {
    expect(runPauseFavoriteToggle).toBe(runFavoriteFromFavoriteFlow);
    expect(shouldShowFavoriteFromFlow).toBe(shouldShowFavoriteFromFavoriteFlow);
    expect(runPauseReflectNoteUpdate).toBe(runNoteFromNoteFlow);
    expect(runPauseReflectTagUpdate).toBe(runTagFromTagFlow);
    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepFromLogFlow);
    expect(shouldLogFromFlow).toBe(shouldLogFromLogFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-favorite-toggle-flow.test.ts` /
   * `pause-reflection-step-log-flow.test.ts` (favorite vs reflection_step log subclusters).
   * Dedicated sibling files: `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`,
   * `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: favorite-toggle-flow and reflection-step-log-flow stay distinct via steps umbrella', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectionStepFromLogFlow);
    expect(runPauseFavoriteToggle).not.toBe(shouldLogFromLogFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(runReflectionStepFromLogFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(shouldLogFromLogFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runFavoriteFromFavoriteFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(shouldShowFavoriteFromFavoriteFlow);
    expect(shouldLogFromFlow).not.toBe(runFavoriteFromFavoriteFlow);
    expect(shouldLogFromFlow).not.toBe(shouldShowFavoriteFromFavoriteFlow);
    expect(runPauseFavoriteToggle).not.toBe(runPauseReflectionStepLogOnce);
    expect(shouldShowFavoriteFromFlow).not.toBe(shouldLogFromFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runReflectionStepFromLogFlow);
    expect(runPauseReflectTagUpdate).not.toBe(shouldLogFromLogFlow);
  });

  it('sibling cluster: note-flow and tag-flow exports stay distinct from steps umbrella-only bindings', () => {
    expect(runPauseFavoriteToggle).not.toBe(runNoteFromNoteFlow);
    expect(runPauseFavoriteToggle).not.toBe(runTagFromTagFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runFavoriteFromFavoriteFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runFavoriteFromFavoriteFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runTagFromTagFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runNoteFromNoteFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runNoteFromNoteFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runTagFromTagFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(runNoteFromNoteFlow);
    expect(shouldLogFromFlow).not.toBe(runTagFromTagFlow);
    // Full cross-flow pins: `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-favorite-toggle-flow.test.ts` and
   * `pause-reflection-step-log-flow.test.ts`. Dedicated sibling file:
   * `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: favorite-toggle-flow and reflection-step-log-flow stay distinct subcluster anchors', () => {
    expect(runFavoriteFromFavoriteFlow).not.toBe(runReflectionStepFromLogFlow);
    expect(shouldShowFavoriteFromFavoriteFlow).not.toBe(shouldLogFromLogFlow);
    expect(runPauseFavoriteToggle).not.toBe(runReflectionStepFromLogFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runFavoriteFromFavoriteFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(shouldLogFromLogFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(runReflectionStepFromLogFlow);
    expect(shouldLogFromFlow).not.toBe(runFavoriteFromFavoriteFlow);
    expect(shouldLogFromFlow).not.toBe(shouldShowFavoriteFromFavoriteFlow);
  });

  it('sibling cluster: flows-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(resolvePreflightFromFlowsFlow);
    expect(runPauseFavoriteToggle).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(resolvePreflightFromFlowsFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(resolvePreflightFromFlowsFlow);
    expect(shouldLogFromFlow).not.toBe(runOutcomeLogFromFlowsFlow);
  });

  it('sibling cluster: hub-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(runShiftHubDoneFromHubFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runShiftHubDoneFromHubFlow);
    expect(runPauseReflectTagUpdate).not.toBe(buildHubLogBundleFromHubFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(buildHubLogBundleFromHubFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(resolveHubPresentationFromHubFlow);
    expect(shouldLogFromFlow).not.toBe(resolveHubPresentationFromHubFlow);
  });

  it('sibling cluster: pending-offer-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(runAdoptFromPendingOfferFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runDeclineFromPendingOfferFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runAdoptFromPendingOfferFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(runDeclineFromPendingOfferFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(getDisplayFromPendingOfferFlow);
    expect(shouldLogFromFlow).not.toBe(trackAdoptedFromPendingOfferFlow);
    expect(shouldLogFromFlow).not.toBe(trackDeclinedFromPendingOfferFlow);
    expect(shouldLogFromFlow).not.toBe(trackAbandonedFromPendingOfferFlow);
    expect(runPauseReflectTagUpdate).not.toBe(trackDeclinedFromPendingOfferFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(trackDeclinedFromPendingOfferFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-flow.test.ts` (steps-flow cluster).
   * Dedicated sibling file: `pause-reflect-steps-generation-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(runPauseReflectTagUpdate).not.toBe(prerequisiteFromGenerationFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(openManualFromGenerationFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(shouldLogFromFlow).not.toBe(openManualFromGenerationFlow);
    expect(runPauseReflectTagUpdate).not.toBe(shouldCommitFromGenerationFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(openManualFromGenerationFlow);
    expect(runPauseFavoriteToggle).not.toBe(messageFromResultFromGenerationFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(shouldCommitFromGenerationFlow);
    expect(runPauseReflectTagUpdate).not.toBe(messageFromResultFromGenerationFlow);
    expect(runPauseReflectTagUpdate).not.toBe(dismissFromGenerationFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(shouldCommitFromGenerationFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(shouldCommitFromGenerationFlow);
    expect(shouldLogFromFlow).not.toBe(dismissFromGenerationFlow);
    // Full cross-flow pins: `pause-reflect-steps-generation-flow-sibling-parity.test.ts`.
  });

  it('sibling cluster: share-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(runShareImageFromShareFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(buildShareTextFromShareFlow);
    expect(runPauseReflectTagUpdate).not.toBe(runShareImageFromShareFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(trackShareTapFromShareFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(buildShareTextFromShareFlow);
    expect(shouldLogFromFlow).not.toBe(trackShareTapFromShareFlow);
  });

  it('sibling cluster: telemetry-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(trackPostItFromTelemetryFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(trackShareTapFromTelemetryFlow);
    expect(runPauseReflectTagUpdate).not.toBe(trackWallpaperFromTelemetryFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(trackPostItFromTelemetryFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(trackShareTapFromTelemetryFlow);
    expect(shouldLogFromFlow).not.toBe(trackWallpaperFromTelemetryFlow);
    expect(runPauseReflectTagUpdate).not.toBe(trackShareTapFromTelemetryFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(trackPostItFromTelemetryFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-flow.test.ts` (steps-flow cluster).
   * Dedicated sibling file: `pause-reflect-steps-ambience-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: ambience-flow exports stay distinct from steps umbrella exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(startAmbienceFromAmbienceFlow);
    expect(runPauseReflectNoteUpdate).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(runPauseReflectTagUpdate).not.toBe(startAmbienceFromAmbienceFlow);
    expect(runPauseReflectionStepLogOnce).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(startAmbienceFromAmbienceFlow);
    expect(shouldLogFromFlow).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(runPauseReflectTagUpdate).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(shouldShowFavoriteFromFlow).not.toBe(stopAmbienceFromAmbienceFlow);
    // Full cross-flow pins: `pause-reflect-steps-ambience-flow-sibling-parity.test.ts`.
  });
});
