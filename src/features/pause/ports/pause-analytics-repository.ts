export type CompanionFeedbackVote = 'up' | 'down';

/** Port for pause-related `analytics_events` I/O — implemented in infrastructure. */
export interface PauseAnalyticsRepository {
  insertEvent(params: {
    userId: string;
    event: string;
    metadata: Record<string, unknown>;
  }): Promise<{ ok: boolean }>;
  fetchCompanionFeedbackVote(params: {
    userId: string;
    pauseInstanceId: string;
    companionType: string;
  }): Promise<CompanionFeedbackVote | null>;
}
