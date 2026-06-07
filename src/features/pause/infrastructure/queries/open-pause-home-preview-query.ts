import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import { hasReachedReflectForHome } from '@/features/pause/domain/home/has-reached-reflect-for-home';
import { reflectionTextMessageFromArtifactRows } from '@/features/pause/domain/reflect/generation/reflection-text-from-artifact-rows';
import { companionDataFromArtifacts } from '@/features/pause/application/use-cases/ritual/frame/companion-data-from-artifacts';
import { trackedAssetSymbol, normalizeTrackedAssetId } from '@/features/market/domain/tracked-assets';

export type OpenPauseHomePreview = {
  pauseInstanceId: string;
  createdAt: string;
  engagedAt: string | null;
  openPauseMetadata: Record<string, unknown> | null;
  openPauseState: 'active' | 'engaged';
  openPauseSource: string | null;
  contextText: string | null;
  contextSnapshot: Record<string, unknown> | null;
  reflectionMessage: string | null;
  hasReflectionStep: boolean;
  hasOpenPauseStepEvents: boolean;
  hasReachedReflect: boolean;
  isBriefRitual: boolean;
  companions: CompanionData;
};

async function fetchPauseStepEventCount(
  pauseInstanceId: string,
  stepType?: string,
): Promise<number> {
  let query = supabase
    .from('pause_step_events' as never)
    .select('id', { count: 'exact', head: true })
    .eq('pause_instance_id', pauseInstanceId);

  if (stepType) {
    query = query.eq('step_type', stepType);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

/**
 * Home `HolzenProvider` open-pause preview: `v_pause_current` + companion artifacts.
 * Returns null when the user has no current pause row.
 */
export async function fetchOpenPauseHomePreview(userId: string): Promise<OpenPauseHomePreview | null> {
  const { data, error } = await supabase
    .from('v_pause_full' as never)
    .select('id, created_at, engaged_at, metadata, context_snapshot, state, is_brief_ritual, source')
    .eq('user_id', userId)
    .in('state', ['active', 'engaged'])
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    id: string;
    created_at: string;
    engaged_at: string | null;
    metadata: Record<string, unknown> | null;
    context_snapshot: Record<string, unknown> | null;
    state?: string;
    is_brief_ritual?: boolean | null;
    source?: string | null;
  };

  const openPauseState =
    row.state === 'engaged' ? 'engaged' : row.state === 'active' ? 'active' : null;
  if (!openPauseState) return null;

  const contextSnapshot = row.context_snapshot ?? null;
  const contextText =
    typeof contextSnapshot?.context_text === 'string'
      ? (contextSnapshot.context_text as string)
      : null;

  const assetId = normalizeTrackedAssetId(
    typeof contextSnapshot?.tracked_asset_id === 'string'
      ? contextSnapshot.tracked_asset_id
      : 'bitcoin',
  );
  const assetSymbol = trackedAssetSymbol(assetId);

  const [{ data: artifacts }, reflectionStepCount, stepEventCount] = await Promise.all([
    supabase
      .from('pause_ai_artifacts' as never)
      .select('kind, content')
      .eq('pause_instance_id', row.id),
    fetchPauseStepEventCount(row.id, 'reflection_step'),
    fetchPauseStepEventCount(row.id),
  ]);

  const hasReflectionStep = reflectionStepCount > 0;
  const hasOpenPauseStepEvents = stepEventCount > 0;

  const artifactRows = (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>;
  const reflectionMessage = reflectionTextMessageFromArtifactRows(artifactRows);
  const hasReachedReflect = hasReachedReflectForHome({
    hasReflectionStep,
    reflectionMessage,
    trackedAssetSymbol: assetSymbol,
  });

  return {
    pauseInstanceId: row.id,
    createdAt: row.created_at,
    engagedAt: row.engaged_at ?? null,
    openPauseMetadata: row.metadata ?? null,
    openPauseState,
    openPauseSource: row.source ?? null,
    contextText,
    contextSnapshot,
    reflectionMessage,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    hasReachedReflect,
    isBriefRitual: row.is_brief_ritual === true,
    companions: companionDataFromArtifacts(artifactRows),
  };
}
