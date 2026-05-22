import { describe, expect, it } from 'vitest';

import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';

import { runPauseFavoriteToggle as runFavoriteDirect } from './run-pause-favorite-toggle';
import { runPauseFavoriteToggle, shouldShowFavoriteProHint as shouldShowFromFlow } from './pause-favorite-toggle-flow';
import {
  runPauseReflectionStepLogOnce as runReflectionStepFromLogFlow,
  shouldLogPauseReflectionStep as shouldLogFromLogFlow,
} from './pause-reflection-step-log-flow';

describe('pause-favorite-toggle-flow', () => {
  it('re-exports favorite toggle use case and domain pro-hint gate', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof shouldShowFromFlow).toBe('function');

    expect(runPauseFavoriteToggle).toBe(runFavoriteDirect);
    expect(shouldShowFromFlow).toBe(shouldShowFavoriteProHint);
  });

  it('sibling cluster: reflection-step-log-flow exports stay distinct from favorite-toggle-flow exports', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectionStepFromLogFlow);
    expect(shouldShowFromFlow).not.toBe(shouldLogFromLogFlow);
    expect(runPauseFavoriteToggle).not.toBe(shouldLogFromLogFlow);
    expect(shouldShowFromFlow).not.toBe(runReflectionStepFromLogFlow);
  });
});
