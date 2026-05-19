import { FEEDBACK_TO_CACHE_TYPE } from '@/features/pause/domain/companion-types';

export type CompanionFeedbackVote = 'up' | 'down';

export interface LogCompanionFeedbackVoteInput {
  userId: string;
  companionType: string;
  vote: CompanionFeedbackVote;
  cacheId?: string | null;
  pauseInstanceId?: string | null;
}

export function buildCompanionFeedbackVoteMetadata(
  input: Omit<LogCompanionFeedbackVoteInput, 'userId'>,
): Record<string, unknown> {
  const cacheType = FEEDBACK_TO_CACHE_TYPE[input.companionType];
  return {
    companion_type: input.companionType,
    cache_type: cacheType || input.companionType,
    vote: input.vote,
    cache_id: input.cacheId ?? null,
    pause_instance_id: input.pauseInstanceId ?? null,
  };
}
