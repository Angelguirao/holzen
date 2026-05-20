import { trackEvent } from '@/lib/posthog';

export type PauseOutcomeRetrospectiveSurface = 'archive';

/** User saves outcome_logged from Archive for expired/dismissed pauses (taxonomy: pause_outcome_retrospective). */
export function trackPauseOutcomeRetrospective(params: {
  pauseInstanceId: string;
  outcome: string;
  surface?: PauseOutcomeRetrospectiveSurface;
}): void {
  try {
    trackEvent('pause_outcome_retrospective', {
      pause_instance_id: params.pauseInstanceId,
      outcome: params.outcome,
      surface: params.surface ?? 'archive',
    });
  } catch {
    /* no-op */
  }
}
