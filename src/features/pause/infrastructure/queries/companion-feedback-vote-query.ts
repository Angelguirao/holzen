import type { LogCompanionFeedbackVoteInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-feedback-vote';
import {
  fetchPauseCompanionFeedbackVote,
  logPauseCompanionFeedbackVote,
} from '@/features/pause/public-rpc';

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

export async function logCompanionFeedbackVote(
  input: LogCompanionFeedbackVoteInput,
): Promise<{ ok: boolean }> {
  return logPauseCompanionFeedbackVote(input);
}

export async function fetchCompanionFeedbackVote(
  userId: string,
  pauseInstanceId: string,
  companionType: string,
): Promise<'up' | 'down' | null> {
  return fetchPauseCompanionFeedbackVote(userId, pauseInstanceId, companionType);
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
