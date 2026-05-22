import { describe, expect, it } from 'vitest';

import { getPendingPauseOfferDisplay } from './pending-pause-offer-display';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '../telemetry/pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned } from '../telemetry/pause-session-abandoned-telemetry';
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from './pause-pending-offer-display-flow';
import {
  runAdoptPendingPauseOffer as runAdoptFromRpcSubcluster,
  runDeclinePendingPauseOffer as runDeclineFromRpcSubcluster,
} from './pause-reflect-pending-offer-rpc-flow';
import {
  trackPausePendingAdopted as trackAdoptedFromTelemetryFlow,
  trackPausePendingDeclined as trackDeclinedFromTelemetryFlow,
  trackPauseSessionAbandoned as trackAbandonedFromTelemetryFlow,
} from '../telemetry/pause-pending-offer-telemetry-flow';
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
});
