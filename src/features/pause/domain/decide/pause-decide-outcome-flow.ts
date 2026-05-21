import {
  buildPauseImpactDataOnComplete,
  type BuildPauseImpactDataOnCompleteInput,
  type PauseImpactData,
} from '@/features/pause/domain/decide/build-pause-impact-data-on-complete';
import type { RunPauseOutcomeLogResult } from '@/features/pause/domain/decide/pause-outcome-log-result';
import type { WisdomQuote } from '@/features/pause/domain/decide/session-wisdom-quotes';

export type PauseDecideOutcomeFlow =
  | { kind: 'abort_sync_failed' }
  | { kind: 'abort_not_completed'; invalidateStats: true; refreshSubscription: true }
  | {
      kind: 'advance';
      refreshSubscription: boolean;
      decision: string;
      pauseImpactData: PauseImpactData;
    };

export function formatReinforcementQuoteFromSession(quote: WisdomQuote): string {
  return `"${quote.text}" — ${quote.author}`;
}

/** Maps `runPauseOutcomeLog` result + ritual snapshot into presentation actions (no React). */
export function resolvePauseDecideOutcomeFlow(params: {
  outcome: RunPauseOutcomeLogResult;
  decision: string;
  ritualSnapshot: Omit<BuildPauseImpactDataOnCompleteInput, 'decision' | 'reinforcementQuote'>;
  reinforcementQuote: string;
}): PauseDecideOutcomeFlow {
  if (params.outcome.status === 'sync_failed') {
    return { kind: 'abort_sync_failed' };
  }
  if (params.outcome.status === 'not_completed') {
    return { kind: 'abort_not_completed', invalidateStats: true, refreshSubscription: true };
  }
  return {
    kind: 'advance',
    refreshSubscription: params.outcome.status === 'completed',
    decision: params.decision,
    pauseImpactData: buildPauseImpactDataOnComplete({
      ...params.ritualSnapshot,
      decision: params.decision,
      reinforcementQuote: params.reinforcementQuote,
    }),
  };
}
