import type { QueryClient } from '@tanstack/react-query';
import { EMPTY_COMPANION_UI_COMPLETION } from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';
import type { CompanionUiCompletionState } from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';
import {
  countEngagedFrameCompanionTools,
  listCompletedFrameCompanionSlots,
  type PauseFrameCompanionSlot,
} from '@/features/pause/domain/done/pause-frame-companion-slots';
import { parseCompanionSlotFavoritesFromMetadata } from '@/features/pause/domain/companion/companion-slot-favorites-metadata';
import {
  PAUSE_REFLECT_STEP_NOTE,
  PAUSE_REFLECT_STEP_TAGS,
  tagsFromReflectRow,
  type PauseReflectStepLatestRow,
} from '@/features/pause/domain/reflect/steps/reflect-step-latest';
import {
  PRACTICE_XP_COMPANION_SLOT_FAVORITE_EACH,
  PRACTICE_XP_COMPANION_SLOT_FAVORITE_MAX,
} from '@/features/pause/domain/practice/practice-xp-constants';
import { companionUiCompletionQueryKey } from '@/features/pause/infrastructure/queries/companion/companion-ui-completion-query-key';
import { pauseReflectStepLatestQueryKey } from '@/features/pause/infrastructure/queries/reflect/steps/reflect-step-query-key';

export type PauseImpactPracticeFields = {
  engagedTools: number;
  wroteNote: boolean;
  usedTags: boolean;
  completedFrameCompanions: PauseFrameCompanionSlot[];
  companionSlotFavoriteXp: number;
};

function companionSlotFavoriteXpFromMetadata(metadata: unknown): number {
  const bucket = parseCompanionSlotFavoritesFromMetadata(metadata);
  const n = Object.values(bucket).filter(Boolean).length;
  if (n <= 0) return 0;
  return Math.min(PRACTICE_XP_COMPANION_SLOT_FAVORITE_MAX, PRACTICE_XP_COMPANION_SLOT_FAVORITE_EACH * n);
}

function readNoteTextFromCache(queryClient: QueryClient, pauseInstanceId: string): string {
  const cached = queryClient.getQueryData<string | PauseReflectStepLatestRow | null>(
    pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_NOTE),
  );
  if (typeof cached === 'string') return cached;
  if (cached && typeof cached === 'object' && 'payload' in cached) {
    const text = cached.payload?.text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

function readTagsFromCache(queryClient: QueryClient, pauseInstanceId: string): string[] {
  const cached = queryClient.getQueryData<string[] | PauseReflectStepLatestRow | null>(
    pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_TAGS),
  );
  if (Array.isArray(cached)) return cached;
  if (cached && typeof cached === 'object' && 'payload' in cached) {
    return tagsFromReflectRow(cached);
  }
  return [];
}

/** Hydrates practice fields for Done impact from TanStack Query cache at decide time. */
export function readPauseImpactPracticeFieldsFromCache(
  queryClient: QueryClient,
  pauseInstanceId: string | null | undefined,
  instanceMetadata?: unknown,
): PauseImpactPracticeFields {
  if (!pauseInstanceId) {
    return {
      engagedTools: 0,
      wroteNote: false,
      usedTags: false,
      completedFrameCompanions: [],
      companionSlotFavoriteXp: companionSlotFavoriteXpFromMetadata(instanceMetadata),
    };
  }

  const completion =
    queryClient.getQueryData<CompanionUiCompletionState>(companionUiCompletionQueryKey(pauseInstanceId)) ??
    EMPTY_COMPANION_UI_COMPLETION;
  const note = readNoteTextFromCache(queryClient, pauseInstanceId);
  const tags = readTagsFromCache(queryClient, pauseInstanceId);

  return {
    engagedTools: countEngagedFrameCompanionTools(completion),
    wroteNote: note.trim().length > 0,
    usedTags: tags.length > 0,
    completedFrameCompanions: listCompletedFrameCompanionSlots(completion),
    companionSlotFavoriteXp: companionSlotFavoriteXpFromMetadata(instanceMetadata),
  };
}
