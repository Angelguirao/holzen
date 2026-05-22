import { describe, expect, it } from 'vitest';

import { getPendingPauseOfferDisplay } from './pending-pause-offer-display';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned } from './pause-session-abandoned-telemetry';
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from './pause-pending-offer-display-flow';
import {
  runAdoptPendingPauseOffer as runAdoptFromRpcSubcluster,
  runDeclinePendingPauseOffer as runDeclineFromRpcSubcluster,
} from './pause-reflect-pending-offer-rpc-flow';
import {
  trackPausePendingAdopted as trackAdoptedFromTelemetryFlow,
  trackPausePendingDeclined as trackDeclinedFromTelemetryFlow,
  trackPauseSessionAbandoned as trackAbandonedFromTelemetryFlow,
} from './pause-pending-offer-telemetry-flow';
import {
  getPendingPauseOfferDisplay as getDisplayFromFlow,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted as trackAdoptedFromFlow,
  trackPausePendingDeclined as trackDeclinedFromFlow,
  trackPauseSessionAbandoned as trackAbandonedFromFlow,
} from './pause-reflect-pending-offer-flow';
import { runAdoptPendingPauseOffer as runAdoptDirect } from './run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from './run-decline-pending-pause-offer';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from '../steps/pause-reflect-steps-flow';
import {
  buildReflectionShareText as buildShareTextFromShareFlow,
  runReflectionShareImage as runShareImageFromShareFlow,
  trackPauseReflectPostItOpen as trackPostItFromShareFlow,
} from '../share/pause-reflect-share-flow';
import {
  dismissOpenPauseHome as dismissFromGenerationFlow,
  openManualPauseFromHome as openManualFromGenerationFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromGenerationFlow,
  runReflectGeneration as runReflectGenerationFromGenerationFlow,
} from '../generation/pause-reflect-generation-flow';
import {
  buildPauseScoreImpacts as buildImpactsFromFlowsFlow,
  formatReinforcementQuoteFromSession as formatQuoteFromFlowsFlow,
  getSessionQuote as getQuoteFromFlowsFlow,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFromFlowsFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlowsFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlowsFlow,
} from '../flows/pause-reflect-flows-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubFlow,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubFlow,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromHubFlow,
} from '../hub/pause-reflect-hub-flow';
import {
  startPauseReflectFrameFocusAmbience as startAmbienceFromAmbienceFlow,
  stopPauseReflectFrameFocusAmbience as stopAmbienceFromAmbienceFlow,
} from '../ambience/pause-reflect-ambience-flow';

describe('pause-reflect-pending-offer-flow', () => {
  it('re-exports pending-offer RPC use cases, display projection, and telemetry trackers from leaf modules', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getDisplayFromFlow).toBe('function');
    expect(typeof trackAdoptedFromFlow).toBe('function');
    expect(typeof trackDeclinedFromFlow).toBe('function');
    expect(typeof trackAbandonedFromFlow).toBe('function');

    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
    expect(getDisplayFromFlow).toBe(getPendingPauseOfferDisplay);
    expect(trackAdoptedFromFlow).toBe(trackPausePendingAdopted);
    expect(trackDeclinedFromFlow).toBe(trackPausePendingDeclined);
    expect(trackAbandonedFromFlow).toBe(trackPauseSessionAbandoned);
  });

  it('re-exports pending-offer umbrella bindings identical to rpc, display, and telemetry subcluster anchors', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptFromRpcSubcluster);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineFromRpcSubcluster);
    expect(getDisplayFromFlow).toBe(getDisplayFromDisplayFlow);
    expect(trackAdoptedFromFlow).toBe(trackAdoptedFromTelemetryFlow);
    expect(trackDeclinedFromFlow).toBe(trackDeclinedFromTelemetryFlow);
    expect(trackAbandonedFromFlow).toBe(trackAbandonedFromTelemetryFlow);
  });

  it('sibling cluster: steps-flow exports stay distinct from pending-offer umbrella exports', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runFavoriteFromStepsFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(runNoteFromStepsFlow);
    expect(getDisplayFromFlow).not.toBe(runTagFromStepsFlow);
    expect(getDisplayFromFlow).not.toBe(runReflectionStepFromStepsFlow);
    expect(trackAdoptedFromFlow).not.toBe(runReflectionStepFromStepsFlow);
    expect(trackDeclinedFromFlow).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(trackAbandonedFromFlow).not.toBe(shouldLogFromStepsFlow);
  });

  it('sibling cluster: share-flow exports stay distinct from pending-offer umbrella exports', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runShareImageFromShareFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(buildShareTextFromShareFlow);
    expect(getDisplayFromFlow).not.toBe(trackPostItFromShareFlow);
    expect(trackAdoptedFromFlow).not.toBe(runShareImageFromShareFlow);
    expect(trackDeclinedFromFlow).not.toBe(buildShareTextFromShareFlow);
    expect(trackAbandonedFromFlow).not.toBe(trackPostItFromShareFlow);
  });

  it('sibling cluster: generation-flow exports stay distinct from pending-offer umbrella exports', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(getDisplayFromFlow).not.toBe(resolvePrefetchFromGenerationFlow);
    expect(trackAdoptedFromFlow).not.toBe(openManualFromGenerationFlow);
    expect(trackDeclinedFromFlow).not.toBe(dismissFromGenerationFlow);
    expect(trackAbandonedFromFlow).not.toBe(runReflectGenerationFromGenerationFlow);
  });

  it('sibling cluster: rpc-flow subcluster shares adopt/decline only (not display or telemetry)', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptFromRpcSubcluster);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineFromRpcSubcluster);
    expect(getDisplayFromFlow).not.toBe(runAdoptFromRpcSubcluster);
    expect(trackAdoptedFromFlow).not.toBe(runAdoptFromRpcSubcluster);
    expect(trackDeclinedFromFlow).not.toBe(runDeclineFromRpcSubcluster);
    expect(trackAbandonedFromFlow).not.toBe(runDeclineFromRpcSubcluster);
  });

  it('sibling cluster: display-flow subcluster shares display projection only (not RPC or telemetry)', () => {
    expect(getDisplayFromFlow).toBe(getDisplayFromDisplayFlow);
    expect(runAdoptPendingPauseOffer).not.toBe(getDisplayFromDisplayFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(getDisplayFromDisplayFlow);
    expect(trackAdoptedFromFlow).not.toBe(getDisplayFromDisplayFlow);
    expect(trackDeclinedFromFlow).not.toBe(getDisplayFromDisplayFlow);
    expect(trackAbandonedFromFlow).not.toBe(getDisplayFromDisplayFlow);
  });

  it('sibling cluster: telemetry-flow subcluster shares PostHog trackers only (not RPC or display)', () => {
    expect(trackAdoptedFromFlow).toBe(trackAdoptedFromTelemetryFlow);
    expect(trackDeclinedFromFlow).toBe(trackDeclinedFromTelemetryFlow);
    expect(trackAbandonedFromFlow).toBe(trackAbandonedFromTelemetryFlow);
    expect(runAdoptPendingPauseOffer).not.toBe(trackAdoptedFromTelemetryFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(trackDeclinedFromTelemetryFlow);
    expect(getDisplayFromFlow).not.toBe(trackAbandonedFromTelemetryFlow);
  });

  it('sibling cluster: hub-flow exports stay distinct from pending-offer umbrella exports', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runShiftHubDoneFromHubFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(runShiftHubDoneFromHubFlow);
    expect(getDisplayFromFlow).not.toBe(buildLogBundleFromHubFlow);
    expect(getDisplayFromFlow).not.toBe(resolvePresentationFromHubFlow);
    expect(trackAdoptedFromFlow).not.toBe(runShiftHubDoneFromHubFlow);
    expect(trackDeclinedFromFlow).not.toBe(buildLogBundleFromHubFlow);
    expect(trackAbandonedFromFlow).not.toBe(resolvePresentationFromHubFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-flow.test.ts` (pending-offer vs reflect+decide).
   * Dedicated sibling file: `pause-reflect-flows-pending-offer-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-flow exports stay distinct from pending-offer umbrella exports', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(resolvePreflightFromFlowsFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(resolveAfterGenFromFlowsFlow);
    expect(getDisplayFromFlow).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackAdoptedFromFlow).not.toBe(buildImpactsFromFlowsFlow);
    expect(trackDeclinedFromFlow).not.toBe(formatQuoteFromFlowsFlow);
    expect(trackAbandonedFromFlow).not.toBe(getQuoteFromFlowsFlow);
    expect(runAdoptPendingPauseOffer).not.toBe(resolveOutcomeFromFlowsFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(runOutcomeLogFromFlowsFlow);
    // Reciprocal inline pins: `pause-reflect-flows-flow.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-flow.test.ts` (pending-offer vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-ambience-pending-offer-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: ambience-flow exports stay distinct from pending-offer umbrella exports', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(startAmbienceFromAmbienceFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(getDisplayFromFlow).not.toBe(startAmbienceFromAmbienceFlow);
    expect(getDisplayFromFlow).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(trackAdoptedFromFlow).not.toBe(startAmbienceFromAmbienceFlow);
    expect(trackDeclinedFromFlow).not.toBe(stopAmbienceFromAmbienceFlow);
    expect(trackAbandonedFromFlow).not.toBe(startAmbienceFromAmbienceFlow);
    // Reciprocal inline pins: `pause-reflect-ambience-flow.test.ts`.
  });
});
