import { reflectionContentFromArtifactContent } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { reflectionTextMessageFromContent } from '@/features/pause/domain/reflect/generation/reflection-text-from-artifact-rows';
import type { ReflectionContentV2 } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
import { supabase } from '@/integrations/supabase/client';

async function fetchReflectionArtifactContent(
  pauseInstanceId: string,
): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('content')
    .eq('pause_instance_id', pauseInstanceId)
    .eq('kind', 'reflection_text')
    .maybeSingle();
  if (error || !data) return null;
  return (data as { content: unknown }).content;
}

/**
 * Reads persisted reflect-step copy (`pause_ai_artifacts.kind === 'reflection_text'`).
 * Used to lazy-hydrate ritual Reflect without depending on in-memory companion state.
 */
export async function fetchReflectionTextForPauseInstance(pauseInstanceId: string): Promise<string | null> {
  const content = await fetchReflectionArtifactContent(pauseInstanceId);
  return reflectionTextMessageFromContent(content);
}

export async function fetchReflectionContentForPauseInstance(
  pauseInstanceId: string,
): Promise<ReflectionContentV2 | null> {
  const content = await fetchReflectionArtifactContent(pauseInstanceId);
  return reflectionContentFromArtifactContent(content);
}
