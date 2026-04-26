import { supabase } from '@/integrations/supabase/client';
import type { InterventionState } from '@/lib/companion-orchestrate-types';
import type { CachedHistoricalInsightShape } from '@/components/HistoricalInsightDisplay';

export interface CachedSignalShape {
  title: string;
  body: string;
  source: string;
  url: string;
}

export interface CachedGroundingShape {
  title: string;
  body: string;
  citation: string;
  url: string;
}

export interface CachedZoomOutShape {
  deepTime?: { title?: string; body?: string };
  echo?: {
    id?: string;
    created_at?: string;
    mood?: string | null;
    outcome?: string | null;
    userWords?: { kind: string; body: string; created_at: string }[];
  };
}

export interface ParsedPauseArtifactCache {
  signal?: CachedSignalShape | null;
  grounding?: CachedGroundingShape | null;
  history?: CachedHistoricalInsightShape | null;
  zoomOut?: CachedZoomOutShape | null;
  intervention?: InterventionState | null;
}

type ArtifactRow = { kind: string; content: unknown };

function parsePauseArtifactRows(rows: ArtifactRow[]): ParsedPauseArtifactCache {
  if (!rows.length) return {};
  const result: ParsedPauseArtifactCache = {};
  for (const c of rows) {
    const d = c.content as Record<string, unknown> | null;
    if (c.kind === 'signal' && d?.source) {
      result.signal = {
        title: (d.title as string) ?? '',
        body: (d.body as string) ?? '',
        source: d.source as string,
        url: (d.url as string) ?? '',
      };
    } else if (c.kind === 'ground_nudge' && d) {
      result.grounding = {
        title: (d.title as string) ?? '',
        body: (d.body as string) ?? '',
        citation: (d.citation as string) ?? '',
        url: (d.url as string) ?? '',
      };
    } else if (c.kind === 'historical_insight' && d) {
      result.history = d as unknown as CachedHistoricalInsightShape;
    } else if ((c.kind === 'zoom_out' || c.kind === 'zoom_out_deep_time') && d) {
      if (!result.zoomOut) result.zoomOut = d as CachedZoomOutShape;
    } else if (c.kind === 'intervention' && d) {
      result.intervention = d as unknown as InterventionState;
    }
  }
  return result;
}

export async function fetchParsedPauseArtifactCache(
  pauseInstanceId: string,
): Promise<ParsedPauseArtifactCache> {
  const { data } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('kind, content')
    .eq('pause_instance_id', pauseInstanceId);
  if (!data) return {};
  return parsePauseArtifactRows(data as ArtifactRow[]);
}
