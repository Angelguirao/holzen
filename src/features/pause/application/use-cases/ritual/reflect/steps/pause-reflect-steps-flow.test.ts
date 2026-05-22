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
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferFlow,
} from '../pending-offer/pause-reflect-pending-offer-flow';

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
    expect(shouldLogFromFlow).not.toBe(trackAbandonedFromPendingOfferFlow);
  });
});
