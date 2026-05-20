import { useHolzen } from '@/screens/home/hooks/use-holzen';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import { useCompanionOrchestration } from '@/screens/pause/hooks/use-companion-orchestration';
import {
  useCompanionAccess,
  useCompanionLibraryFavorites,
  useCompanionUiCompletion,
} from '@/features/pause/public-hooks';
import { useToast } from '@/components/ui/use-toast';

export type {
  RegenerateCompanionSlot,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from '@/features/pause/public';

interface UseCompanionDataParams {
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
  const { language } = useHolzen();
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
