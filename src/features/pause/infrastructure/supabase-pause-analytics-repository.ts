import { insertPauseAnalyticsEvent } from '@/features/pause/infrastructure/analytics-events';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

/** Default `PauseAnalyticsRepository` — Supabase `analytics_events` insert adapter. */
export const supabasePauseAnalyticsRepository: PauseAnalyticsRepository = {
  insertEvent: insertPauseAnalyticsEvent,
};
