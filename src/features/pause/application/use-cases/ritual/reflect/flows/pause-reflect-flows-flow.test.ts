import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';

import {
  formatReinforcementQuoteFromSession as formatQuoteFromOutcomeViewFlow,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFlowFromOutcomeViewFlow,
} from '../../decide/pause-decide-outcome-view-flow';
import { runPauseOutcomeLog as runOutcomeLogFromOutcomeLogFlow } from '../../decide/pause-decide-outcome-log-flow';
import {
  showPauseOutcomeNotCompletedToast as showNotCompletedFromOutcomeToastFlow,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromOutcomeToastFlow,
} from '../../decide/pause-decide-outcome-toast-flow';
import {
  buildPauseScoreImpacts as buildImpactsFromScoreImpactsFlow,
  parseScoreImpactVolatilityPct as parseVolatilityFromScoreImpactsFlow,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromScoreImpactsFlow,
  resolveScoreImpactViewMode as resolveViewModeFromScoreImpactsFlow,
  scoreImpactMotionDelaySec as motionDelayFromScoreImpactsFlow,
} from '../../decide/pause-decide-score-impacts-flow';
import { getSessionQuote as getQuoteFromWisdomQuotesFlow } from '../../decide/pause-decide-wisdom-quotes-flow';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '../../decide/outcome-toast';
import { runPauseOutcomeLog } from '../../decide/run-pause-outcome-log';
import {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
} from '../../decide/score-impacts';
import {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
} from '../../decide/score-impact-presentation';
import { getSessionQuote } from '../../decide/wisdom-quotes';

import {
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromAndDecideViewFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromAndDecideViewFlow,
} from './pause-reflect-and-decide-view-flow';
import { runReflectGeneration } from '../generation/pause-reflect-generation-flow';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '../ambience/pause-reflect-ambience-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
} from '../steps/pause-reflect-steps-flow';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '../telemetry/pause-reflect-telemetry-flow';
import {
  buildFeelTilesMoodLogOptions as buildFeelTilesFromMoodFlow,
  runInitialEmotionSelect as runEmotionSelectFromMoodFlow,
  runInitialEmotionSkip as runEmotionSkipFromMoodFlow,
} from '../mood/pause-reflect-mood-flow';
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
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseScoreImpacts as buildImpactsFromFlow,
  formatReinforcementQuoteFromSession as formatQuoteFromFlow,
  getSessionQuote as getQuoteFromFlow,
  parseScoreImpactVolatilityPct as parseVolatilityFromFlow,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFlowFromFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlow,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromFlow,
  resolveScoreImpactViewMode as resolveViewModeFromFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlow,
  scoreImpactMotionDelaySec as motionDelayFromFlow,
  showPauseOutcomeNotCompletedToast as showNotCompletedFromFlow,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromFlow,
} from './pause-reflect-flows-flow';

describe('pause-reflect-flows-flow', () => {
  it('re-exports reflect+decide helpers from domain + ritual/decide leaf modules', () => {
    expect(typeof resolvePreflightFromFlow).toBe('function');
    expect(typeof resolveAfterGenFromFlow).toBe('function');
    expect(typeof formatQuoteFromFlow).toBe('function');
    expect(typeof resolveOutcomeFlowFromFlow).toBe('function');
    expect(typeof getQuoteFromFlow).toBe('function');
    expect(typeof runOutcomeLogFromFlow).toBe('function');
    expect(typeof showNotCompletedFromFlow).toBe('function');
    expect(typeof showSaveFailedFromFlow).toBe('function');
    expect(typeof buildImpactsFromFlow).toBe('function');
    expect(typeof parseVolatilityFromFlow).toBe('function');
    expect(typeof resolveDisplayImpactsFromFlow).toBe('function');
    expect(typeof resolveViewModeFromFlow).toBe('function');
    expect(typeof motionDelayFromFlow).toBe('function');

    expect(resolvePreflightFromFlow).toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(resolveAfterGenFromFlow).toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(formatQuoteFromFlow).toBe(formatReinforcementQuoteFromSession);
    expect(resolveOutcomeFlowFromFlow).toBe(resolvePauseDecideOutcomeFlow);
    expect(getQuoteFromFlow).toBe(getSessionQuote);
    expect(runOutcomeLogFromFlow).toBe(runPauseOutcomeLog);
    expect(showNotCompletedFromFlow).toBe(showPauseOutcomeNotCompletedToast);
    expect(showSaveFailedFromFlow).toBe(showPauseOutcomeSaveFailedToast);
    expect(buildImpactsFromFlow).toBe(buildPauseScoreImpacts);
    expect(parseVolatilityFromFlow).toBe(parseScoreImpactVolatilityPct);
    expect(resolveDisplayImpactsFromFlow).toBe(resolveScoreImpactDisplayImpacts);
    expect(resolveViewModeFromFlow).toBe(resolveScoreImpactViewMode);
    expect(motionDelayFromFlow).toBe(scoreImpactMotionDelaySec);
  });

  it('umbrella bindings match flows subcluster CI anchors (domain leaf parity)', () => {
    expect(resolvePreflightFromFlow).toBe(resolvePreflightFromAndDecideViewFlow);
    expect(resolveAfterGenFromFlow).toBe(resolveAfterGenFromAndDecideViewFlow);
    expect(formatQuoteFromFlow).toBe(formatQuoteFromOutcomeViewFlow);
    expect(resolveOutcomeFlowFromFlow).toBe(resolveOutcomeFlowFromOutcomeViewFlow);
    expect(runOutcomeLogFromFlow).toBe(runOutcomeLogFromOutcomeLogFlow);
    expect(showNotCompletedFromFlow).toBe(showNotCompletedFromOutcomeToastFlow);
    expect(showSaveFailedFromFlow).toBe(showSaveFailedFromOutcomeToastFlow);
    expect(getQuoteFromFlow).toBe(getQuoteFromWisdomQuotesFlow);
    expect(buildImpactsFromFlow).toBe(buildImpactsFromScoreImpactsFlow);
    expect(parseVolatilityFromFlow).toBe(parseVolatilityFromScoreImpactsFlow);
    expect(resolveDisplayImpactsFromFlow).toBe(resolveDisplayImpactsFromScoreImpactsFlow);
    expect(resolveViewModeFromFlow).toBe(resolveViewModeFromScoreImpactsFlow);
    expect(motionDelayFromFlow).toBe(motionDelayFromScoreImpactsFlow);
  });

  it('sibling cluster: generation-flow exports stay distinct from flows umbrella exports', () => {
    expect(resolvePreflightFromFlow).not.toBe(runReflectGeneration);
    expect(resolveAfterGenFromFlow).not.toBe(runReflectGeneration);
    expect(formatQuoteFromFlow).not.toBe(runReflectGeneration);
    expect(resolveOutcomeFlowFromFlow).not.toBe(runReflectGeneration);
    expect(runOutcomeLogFromFlow).not.toBe(runReflectGeneration);
  });

  it('sibling cluster: ambience-flow exports stay distinct from flows umbrella exports', () => {
    expect(resolvePreflightFromFlow).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolveAfterGenFromFlow).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(runOutcomeLogFromFlow).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(formatQuoteFromFlow).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('sibling cluster: steps-flow exports stay distinct from flows umbrella exports', () => {
    expect(resolvePreflightFromFlow).not.toBe(runFavoriteFromStepsFlow);
    expect(resolvePreflightFromFlow).not.toBe(runReflectionStepFromStepsFlow);
    expect(runOutcomeLogFromFlow).not.toBe(runFavoriteFromStepsFlow);
    expect(runOutcomeLogFromFlow).not.toBe(runReflectionStepFromStepsFlow);
    expect(formatQuoteFromFlow).not.toBe(shouldLogFromStepsFlow);
    expect(resolveAfterGenFromFlow).not.toBe(runReflectionStepFromStepsFlow);
  });

  it('sibling cluster: mood-flow exports stay distinct from flows umbrella exports', () => {
    expect(resolvePreflightFromFlow).not.toBe(runEmotionSelectFromMoodFlow);
    expect(resolveAfterGenFromFlow).not.toBe(runEmotionSkipFromMoodFlow);
    expect(runOutcomeLogFromFlow).not.toBe(runEmotionSelectFromMoodFlow);
    expect(formatQuoteFromFlow).not.toBe(buildFeelTilesFromMoodFlow);
    expect(resolveOutcomeFlowFromFlow).not.toBe(runEmotionSkipFromMoodFlow);
    expect(buildImpactsFromFlow).not.toBe(buildFeelTilesFromMoodFlow);
  });

  it('sibling cluster: telemetry-flow exports stay distinct from flows umbrella exports', () => {
    expect(resolvePreflightFromFlow).not.toBe(trackPostItFromTelemetryFlow);
    expect(resolveAfterGenFromFlow).not.toBe(trackShareTapFromTelemetryFlow);
    expect(runOutcomeLogFromFlow).not.toBe(trackWallpaperFromTelemetryFlow);
    expect(formatQuoteFromFlow).not.toBe(trackPostItFromTelemetryFlow);
    expect(resolveOutcomeFlowFromFlow).not.toBe(trackShareTapFromTelemetryFlow);
    expect(buildImpactsFromFlow).not.toBe(trackWallpaperFromTelemetryFlow);
    expect(showNotCompletedFromFlow).not.toBe(trackPostItFromTelemetryFlow);
    // Full cross-umbrella pins: `pause-reflect-flows-telemetry-flow-sibling-parity.test.ts`.
  });

  it('sibling cluster: share-flow exports stay distinct from flows umbrella exports', () => {
    expect(resolvePreflightFromFlow).not.toBe(runShareImageFromShareFlow);
    expect(resolveAfterGenFromFlow).not.toBe(runShareImageFromShareFlow);
    expect(runOutcomeLogFromFlow).not.toBe(buildShareTextFromShareFlow);
    expect(formatQuoteFromFlow).not.toBe(trackShareTapFromShareFlow);
    expect(buildImpactsFromFlow).not.toBe(runShareImageFromShareFlow);
  });

  it('flows CI umbrella re-exports runPauseOutcomeLog as ritual/decide leaf (not presentation port wrappers)', () => {
    expect(runOutcomeLogFromFlow).toBe(runPauseOutcomeLog);
    expect(runOutcomeLogFromFlow).not.toBe(pauseReflectOutcomeLog);
    expect(runOutcomeLogFromFlow).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLog);
  });
});
