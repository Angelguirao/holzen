import { supabase } from '@/integrations/supabase/client';
import type { InterventionState } from '@/lib/companion-orchestrate-types';

export type ReflectionCompanionRow = { companion_type: string; content: unknown };

export interface CachedSignalShape {
  title: string;
  body: string;
  source: string;
  url: string;
  originalUrl?: string;
  originalPublication?: string;
}

export interface CachedGroundingShape {
  title: string;
  body: string;
  citation: string;
  url: string;
}

/** Cached `historical_insight` companion payload (hydration + library autosave). */
export interface CachedHistoricalInsightShape {
  title: string;
  btcInsight: string;
  analogy: string;
  assetClass: string;
  period: string;
}

/** Cached zoom-out payload (structure varies by row type; callers use optional branches). */
export interface CachedZoomOutShape {
  deepTime?: { title?: string; body?: string };
  echo?: { message?: string };
}

/** Parsed `reflection_companions` rows for orchestration skip / hydration. */
export interface ParsedReflectionCompanionCache {
  signal?: CachedSignalShape | null;
  grounding?: CachedGroundingShape | null;
  history?: CachedHistoricalInsightShape | null;
  zoomOut?: CachedZoomOutShape | null;
  intervention?: InterventionState | null;
}

export function parseReflectionCompanionRows(rows: ReflectionCompanionRow[]): ParsedReflectionCompanionCache {
  if (!rows.length) return {};
  const result: ParsedReflectionCompanionCache = {};
  for (const c of rows) {
    const d = c.content as Record<string, unknown> | null;
    if (c.companion_type === 'signal' && d?.source) {
      result.signal = {
        title: (d.title as string) ?? '',
        body: (d.body as string) ?? '',
        source: d.source as string,
        url: (d.url as string) ?? '',
      };
    } else if (c.companion_type === 'ground_nudge' && d) {
      result.grounding = {
        title: (d.title as string) ?? '',
        body: (d.body as string) ?? '',
        citation: (d.citation as string) ?? '',
        url: (d.url as string) ?? '',
      };
    } else if (c.companion_type === 'historical_insight' && d) {
      result.history = d as unknown as CachedHistoricalInsightShape;
    } else if ((c.companion_type === 'zoom_out' || c.companion_type === 'zoom_out_deep_time') && d) {
      if (!result.zoomOut) result.zoomOut = d as CachedZoomOutShape;
    } else if (c.companion_type === 'intervention' && d) {
      result.intervention = d as unknown as InterventionState;
    }
  }
  return result;
}

/** Load `reflection_companions` rows and parse into the hydration shape (client + edge parity). */
export async function fetchParsedReflectionCompanionCache(
  reflectionId: string,
): Promise<ParsedReflectionCompanionCache> {
  const { data: companions } = await supabase
    .from('reflection_companions')
    .select('companion_type, content')
    .eq('reflection_id', reflectionId);
  return parseReflectionCompanionRows((companions ?? []) as ReflectionCompanionRow[]);
}
