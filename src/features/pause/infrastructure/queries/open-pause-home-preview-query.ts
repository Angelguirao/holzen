import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/features/pause/public';
import { companionDataFromArtifacts } from '@/features/pause/application/use-cases/ritual/frame/companion-data-from-artifacts';

export type OpenPauseHomePreview = {
  pauseInstanceId: string;
  createdAt: string;
  openPauseState: 'active' | 'engaged';
  contextText: string | null;
  reflectionMessage: string | null;
  companions: CompanionData;
};

/**
 * Home `HolzenProvider` open-pause preview: `v_pause_current` + companion artifacts.
 * Returns null when the user has no current pause row.
 */
export async function fetchOpenPauseHomePreview(userId: string): Promise<OpenPauseHomePreview | null> {
  const { data, error } = await supabase
    .from('v_pause_current' as never)
    .select('id, created_at, context_snapshot, state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    id: string;
    created_at: string;
    context_snapshot: Record<string, unknown> | null;
    state?: string;
  };

  const openPauseState =
    row.state === 'engaged' ? 'engaged' : row.state === 'active' ? 'active' : null;
  if (!openPauseState) return null;

  const contextText =
    typeof row.context_snapshot?.context_text === 'string'
      ? (row.context_snapshot.context_text as string)
      : null;

  const { data: artifacts } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('kind, content')
    .eq('pause_instance_id', row.id);

  const artifactRows = (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>;

  let reflectionMessage: string | null = null;
  for (const a of artifactRows) {
    if (a.kind === 'reflection_text' && typeof a.content?.message === 'string') {
      reflectionMessage = a.content.message as string;
      break;
    }
  }

  return {
    pauseInstanceId: row.id,
    createdAt: row.created_at,
    openPauseState,
    contextText,
    reflectionMessage,
    companions: companionDataFromArtifacts(artifactRows),
  };
}
