import { supabase } from '@/integrations/supabase/client';
import {
  parsePauseArtifactRows,
  type ParsedPauseArtifactCache,
} from '@/features/pause/application/use-cases/companion/artifact-cache-parse';

export type {
  CachedGroundingShape,
  CachedSignalShape,
  CachedZoomOutShape,
  ParsedPauseArtifactCache,
} from '@/features/pause/application/use-cases/companion/artifact-cache-parse';

export async function fetchParsedPauseArtifactCache(
  pauseInstanceId: string,
): Promise<ParsedPauseArtifactCache> {
  const { data } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('kind, content')
    .eq('pause_instance_id', pauseInstanceId);
  if (!data) return {};
  return parsePauseArtifactRows(data as Array<{ kind: string; content: unknown }>);
}
