import { supabase } from '@/integrations/supabase/client';
import { buildReflectRecencyHintsFromRows } from '@/features/pause/domain/reflect/generation/build-reflect-recency-hints';
import type {
  ReflectMoodHistoryEntry,
  ReflectRecencyHints,
} from '@/features/pause/domain/reflect/generation/reflect-recency-hints';

export type { ReflectMoodHistoryEntry, ReflectRecencyHints };

/**
 * Pause V2: mood + dedup hints for edge `holzen-reflect` (Reflect step in `PauseSession`).
 * Mirrors `pauseRecencyInputs` in `supabase/functions/_shared/pause-cron-parity.ts`
 * so the manual reflect-step sees the same shapes as `check-volatility`.
 */

/**
 * Loads recency hints for the signed-in user. Returns empty fields on error or
 * unauthenticated callers (reflect step still runs without hints).
 */
export async function loadReflectRecencyHints(): Promise<ReflectRecencyHints> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return {};

    const [{ data: stepRows }, { data: artifacts }] = await Promise.all([
      supabase
        .from('pause_step_events' as never)
        .select('pause_instance_id, step_type, payload, created_at')
        .eq('user_id', userId)
        .in('step_type', ['initial_emotion_logged', 'outcome_logged'])
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('pause_ai_artifacts' as never)
        .select('kind, content, created_at')
        .eq('user_id', userId)
        .in('kind', ['reflection_text', 'haiku'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    return buildReflectRecencyHintsFromRows(
      (stepRows ?? []) as Array<{
        pause_instance_id: string;
        step_type: string;
        payload: Record<string, unknown> | null;
        created_at: string;
      }>,
      (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>,
    );
  } catch {
    return {};
  }
}
