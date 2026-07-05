import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import {
  resolveHistoricalMarketInsight,
  type CachedHistoricalInsightShape,
} from '@/features/pause/domain/historical-insight';
import { normalizeSignalPayload } from '@/features/pause/domain/signal-payload';
import type { ZoomOutData } from '@/features/pause/domain/zoom-out-display';

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Ground yourself — matches Frame `GroundingDisplay` (title or body). */
export function hasDisplayableGroundingContent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const g = data as { title?: string; body?: string };
  return hasNonEmptyString(g.title) || hasNonEmptyString(g.body);
}

/** Zoom out — deep-time copy or at least one echo user word. */
export function hasDisplayableZoomOutContent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const o = data as ZoomOutData;
  if (o.deepTime && (hasNonEmptyString(o.deepTime.title) || hasNonEmptyString(o.deepTime.body))) {
    return true;
  }
  const primary = o.echo?.userWords?.[0]?.body;
  return hasNonEmptyString(primary);
}

/** Signal — requires a non-empty source (same as `normalizeSignalPayload`). */
export function hasDisplayableSignalContent(data: unknown): boolean {
  return normalizeSignalPayload(data) !== null;
}

/** Look back — insight body, title, or BTC on-this-day overlay. */
export function hasDisplayableHistoryContent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const h = data as CachedHistoricalInsightShape;
  if (hasNonEmptyString(resolveHistoricalMarketInsight(h))) return true;
  if (hasNonEmptyString(h.title)) return true;
  return typeof h.currentPrice === 'number' && (h.onThisDay?.length ?? 0) > 0;
}

/** Whether the slot UI would render companion body (not loading/error/null shell). */
export function companionSlotHasDisplayableContent(
  slot: RegenerateCompanionSlot,
  data: unknown,
): boolean {
  switch (slot) {
    case 'signal':
      return hasDisplayableSignalContent(data);
    case 'grounding':
      return hasDisplayableGroundingContent(data);
    case 'zoomOut':
      return hasDisplayableZoomOutContent(data);
    case 'history':
      return hasDisplayableHistoryContent(data);
    default:
      return false;
  }
}
