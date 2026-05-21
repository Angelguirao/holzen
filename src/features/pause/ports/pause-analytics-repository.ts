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
  /** Latest `dev_mode_setting` row for admin rapid-testing toggle; `null` when none or on error. */
  fetchDevModeSetting(userId: string): Promise<boolean | null>;
}
