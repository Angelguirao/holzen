/** Port for pause-related `analytics_events` writes — implemented in infrastructure. */
export interface PauseAnalyticsRepository {
  insertEvent(params: {
    userId: string;
    event: string;
    metadata: Record<string, unknown>;
  }): Promise<{ ok: boolean }>;
}
