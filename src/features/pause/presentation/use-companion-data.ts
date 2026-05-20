import type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import { useProfile } from '@/features/user/public-hooks';
import { useToast } from '@/components/ui/use-toast';
import { useCompanionAccess } from './companion/use-companion-access';
import { useCompanionLibraryFavorites } from './use-companion-library-favorites';
import { useCompanionOrchestration } from './use-companion-orchestration';
import { useCompanionUiCompletion } from './use-companion-ui-completion';

export type {
  RegenerateCompanionSlot,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from '@/features/pause/public';

export interface UseCompanionDataParams {
  companions: CompanionData;
  prefs: CompanionPrefs;
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
}

/** Pause companion section: favorites, completion, access gate, and orchestration stack. */
export function useCompanionData({
  companions: _companions,
  prefs: _prefs,
  pauseInstanceId,
  context,
  reflectionMessage,
  mood,
  severityNumber,
}: UseCompanionDataParams) {
  const { language } = useProfile();
  const { toast } = useToast();
  const { favorites, toggleCompanionFavorite } = useCompanionLibraryFavorites(pauseInstanceId);
  const access = useCompanionAccess();
  const { completion, markCompleted } = useCompanionUiCompletion(pauseInstanceId);
  const orchestration = useCompanionOrchestration({
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    toast,
    ...access,
  });

  return {
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    canAccessCompanion: access.canAccessCompanion,
    ...orchestration,
  };
}
