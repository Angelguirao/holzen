import { supabase } from '@/integrations/supabase/client';
import {
  COMPANION_STEP_TO_REFLECTION_COLUMN,
  COMPANION_STEP_TO_READ_TYPE,
} from '@/lib/companion-completion-maps';
import { logPauseCompanionIfV2 } from '@/lib/pause-step-logger';

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

/**
 * Persist "completed / read" for one pause step.
 *
 * Legacy path: updates `reflections` ritual columns + `reflection_companions.read`.
 * Phase E additionally appends a `pause_companion_events` row via the Phase B
 * RPC when `pauseInstanceId` is provided and the V2 flag is on. The RPC
 * decides `counts_for_pause` server-side; this caller just needs the ids.
 *
 * `entryPoint` is analytics-only metadata. The main caller is
 * `PauseReflect` (entry_point='pause_flow'); Library may also hit this
 * path with 'library' after Phase F.
 */
export async function persistCompanionUiStepCompletion(
  reflectionId: string,
  step: CompanionUiCompletionStep,
  options?: {
    pauseInstanceId?: string | null;
    entryPoint?: string;
  },
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

  // Phase E: Pause V2 companion event. Only fires if the caller passed an
  // instance id (manual pauses always have one; legacy reflections opened
  // before V2 was live won't — those silently skip).
  if (options?.pauseInstanceId && companionType) {
    void logPauseCompanionIfV2({
      pauseInstanceId: options.pauseInstanceId,
      // Normalize zoom_out_deep_time -> zoom_out for the template's
      // allowed_companion_types check (both variants are allowed, but
      // we prefer a single canonical value on the event row).
      companionType:
        step === 'zoomOut' ? 'zoom_out' : companionType,
      action: 'complete',
      entryPoint: options.entryPoint ?? 'pause_flow',
    });
  }

  // Breathing step isn't in COMPANION_STEP_TO_READ_TYPE (that map only
  // covers content companions), but the V2 equivalent of "breathing
  // completed" is a pause_step_events row of step_type='breath_completed'.
  // That's already logged by PauseSession.onComplete, so no duplicate
  // handling needed here.
}
