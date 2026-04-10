import { supabase } from '@/integrations/supabase/client';
import {
  COMPANION_STEP_TO_REFLECTION_COLUMN,
  COMPANION_STEP_TO_READ_TYPE,
} from '@/lib/companion-completion-maps';

export type CompanionUiCompletionStep =
  | 'breathing'
  | 'haiku'
  | 'grounding'
  | 'signal'
  | 'zoomOut'
  | 'history';

export interface CompanionUiCompletionState {
  breathing: boolean;
  haiku: boolean;
  grounding: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

type ReflectionReadSlice = {
  breathing_completed?: boolean | null;
  haiku_read?: boolean | null;
  grounding_read?: boolean | null;
};

type CompanionReadRow = { companion_type: string; read: boolean | null };

/**
 * Merge `reflections` ritual flags with `reflection_companions.read` (ground_nudge canonical for grounding).
 */
export async function loadCompanionUiCompletionState(
  reflectionId: string,
): Promise<CompanionUiCompletionState> {
  const [{ data: refData }, { data: companions }] = await Promise.all([
    supabase
      .from('reflections')
      .select('breathing_completed, haiku_read, grounding_read')
      .eq('id', reflectionId)
      .single(),
    supabase
      .from('reflection_companions')
      .select('companion_type, read')
      .eq('reflection_id', reflectionId),
  ]);

  const ref = (refData ?? {}) as ReflectionReadSlice;
  const companionReadMap: Record<string, boolean> = {};
  for (const c of (companions ?? []) as CompanionReadRow[]) {
    companionReadMap[c.companion_type] = c.read ?? false;
  }

  return {
    breathing: ref.breathing_completed ?? false,
    haiku: ref.haiku_read ?? false,
    grounding: companionReadMap['ground_nudge'] ?? ref.grounding_read ?? false,
    signal: companionReadMap['signal'] ?? false,
    zoomOut: companionReadMap['zoom_out'] ?? companionReadMap['zoom_out_deep_time'] ?? false,
    history: companionReadMap['historical_insight'] ?? false,
  };
}

/** Persist “completed / read” for one pause step to `reflections` and/or `reflection_companions`. */
export async function persistCompanionUiStepCompletion(
  reflectionId: string,
  step: CompanionUiCompletionStep,
): Promise<void> {
  const reflectionKey = COMPANION_STEP_TO_REFLECTION_COLUMN[step];
  if (reflectionKey) {
    await supabase
      .from('reflections')
      .update({ [reflectionKey]: true } as Record<string, boolean>)
      .eq('id', reflectionId);
  }

  const companionType = COMPANION_STEP_TO_READ_TYPE[step];
  if (companionType) {
    if (step === 'zoomOut') {
      await supabase
        .from('reflection_companions')
        .update({ read: true })
        .eq('reflection_id', reflectionId)
        .in('companion_type', ['zoom_out', 'zoom_out_deep_time']);
    } else {
      await supabase
        .from('reflection_companions')
        .update({ read: true })
        .eq('reflection_id', reflectionId)
        .eq('companion_type', companionType);
    }
  }
}
