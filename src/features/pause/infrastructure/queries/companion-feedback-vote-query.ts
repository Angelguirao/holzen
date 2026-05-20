import type { LogCompanionFeedbackVoteInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-feedback-vote';
import { runLogCompanionFeedbackVote } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import { supabasePauseAnalyticsRepository } from '@/features/pause/infrastructure/supabase-pause-analytics-repository';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export const COMPANION_FEEDBACK_VOTE_QUERY_PREFIX = ['companion-feedback-vote'] as const;

export const COMPANION_FEEDBACK_VOTE_DISABLED_USER_ID = 'none' as const;

export const COMPANION_FEEDBACK_VOTE_NONE_QUERY_KEY = [
  ...COMPANION_FEEDBACK_VOTE_QUERY_PREFIX,
  COMPANION_FEEDBACK_VOTE_DISABLED_USER_ID,
] as const;

export function companionFeedbackVoteQueryKey(
  userId: string,
  pauseInstanceId: string,
  companionType: string,
) {
  return [...COMPANION_FEEDBACK_VOTE_QUERY_PREFIX, userId, pauseInstanceId, companionType] as const;
}

function voteFromMetadata(metadata: Json | null | undefined): 'up' | 'down' | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).vote;
  return v === 'up' || v === 'down' ? v : null;
}

export async function logCompanionFeedbackVote(
  input: LogCompanionFeedbackVoteInput,
): Promise<{ ok: boolean }> {
  return runLogCompanionFeedbackVote(supabasePauseAnalyticsRepository, input);
}

export async function fetchCompanionFeedbackVote(
  userId: string,
  pauseInstanceId: string,
  companionType: string,
): Promise<'up' | 'down' | null> {
  try {
    const { data } = await supabase
      .from('analytics_events')
      .select('metadata')
      .eq('user_id', userId)
      .eq('event', 'companion_feedback')
      .filter('metadata->>pause_instance_id', 'eq', pauseInstanceId)
      .filter('metadata->>companion_type', 'eq', companionType)
      .limit(1);
    if (!data || data.length === 0) return null;
    return voteFromMetadata(data[0].metadata);
  } catch {
    return null;
  }
}

export function getCompanionFeedbackVoteQueryOptions(
  userId: string | null | undefined,
  pauseInstanceId: string | null | undefined,
  companionType: string,
) {
  return {
    queryKey:
      userId && pauseInstanceId
        ? companionFeedbackVoteQueryKey(userId, pauseInstanceId, companionType)
        : COMPANION_FEEDBACK_VOTE_NONE_QUERY_KEY,
    queryFn: () => fetchCompanionFeedbackVote(userId!, pauseInstanceId!, companionType),
    enabled: Boolean(userId && pauseInstanceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
