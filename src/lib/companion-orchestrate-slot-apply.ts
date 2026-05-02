import type {
  CompanionOrchestrateSlotResult,
  RegenerateCompanionSlot,
} from '@/lib/companion-orchestrate-types';
import type { CachedHistoricalInsightShape } from '@/components/HistoricalInsightDisplay';
import type { ZoomOutData } from '@/components/ZoomOutDisplay';
import { toZoomOutDisplayData, zoomOutLibraryAutosaveFromDisplayData } from '@/lib/zoom-out-payload';

/** Legacy hook name: companion slots no longer mirror rows into a bookmark table. */
export type CompanionSlotAutosaveParams = {
  title: string;
  body: string;
  sourceType: string;
  sourceUrl?: string;
};
import { updateRecencyHints } from '@/lib/companion-recency-hints';
import { hostnameFromUrl } from '@/lib/companion-url';
import { trackCompanionServed } from '@/lib/companion-analytics';

export type CompanionSlotCacheIds = {
  nudge: string | null;
  signal: string | null;
  zoomOut: string | null;
  history: string | null;
};

/** Shown in UI only for relaxed `serveFromCache` tiers. */
export type CompanionSlotRelaxationUi = 'market' | 'repeat_or_lower_quality' | null;

export type CompanionSlotRelaxations = {
  nudge: CompanionSlotRelaxationUi;
  signal: CompanionSlotRelaxationUi;
  zoomOut: CompanionSlotRelaxationUi;
  history: CompanionSlotRelaxationUi;
};

export const EMPTY_COMPANION_SLOT_RELAXATIONS: CompanionSlotRelaxations = {
  nudge: null,
  signal: null,
  zoomOut: null,
  history: null,
};

function toSlotRelaxationUi(v: string | null | undefined): CompanionSlotRelaxationUi {
  if (v === 'market' || v === 'repeat_or_lower_quality') return v;
  return null;
}

const SLOT_CACHE_KEY: Record<RegenerateCompanionSlot, keyof CompanionSlotCacheIds> = {
  signal: 'signal',
  grounding: 'nudge',
  history: 'history',
  zoomOut: 'zoomOut',
};

export type CompanionSlotCommitters = {
  setSignal: (v: {
    title: string;
    body: string;
    source: string;
    url: string;
  }) => void;
  setNudge: (v: { title: string; body: string; citation: string; url: string }) => void;
  setHistoryInsight: (v: CachedHistoricalInsightShape) => void;
  setZoomOut: (v: ZoomOutData | null) => void;
  autoSaveToLibrary: (p: CompanionSlotAutosaveParams) => void | Promise<void>;
};

export function readOrchestrateSlotBody(
  body: Record<string, unknown>,
  slot: RegenerateCompanionSlot,
): CompanionOrchestrateSlotResult | null {
  switch (slot) {
    case 'signal':
      return body.signal as CompanionOrchestrateSlotResult | null;
    case 'grounding':
      return body.grounding as CompanionOrchestrateSlotResult | null;
    case 'history':
      return body.history as CompanionOrchestrateSlotResult | null;
    case 'zoomOut':
      return body.zoomOut as CompanionOrchestrateSlotResult | null;
    default:
      return null;
  }
}

export function isFilledOrchestrateSlot(
  r: CompanionOrchestrateSlotResult | null | undefined,
): r is CompanionOrchestrateSlotResult & { data: NonNullable<CompanionOrchestrateSlotResult['data']> } {
  return Boolean(r?.data && r.source !== 'empty');
}

function commitOrchestrateSlotData(
  slot: RegenerateCompanionSlot,
  data: unknown,
  c: CompanionSlotCommitters,
): void {
  switch (slot) {
    case 'signal': {
      const d = data as { title: string; body: string; source: string; url: string };
      c.setSignal(d);
      void c.autoSaveToLibrary({ title: d.title, body: d.body, sourceType: 'signal', sourceUrl: d.url });
      break;
    }
    case 'grounding': {
      const d = data as { title: string; body: string; citation: string; url: string };
      c.setNudge(d);
      void c.autoSaveToLibrary({ title: d.title, body: d.body, sourceType: 'grounding', sourceUrl: d.url });
      break;
    }
    case 'history': {
      const d = data as CachedHistoricalInsightShape;
      c.setHistoryInsight(d);
      void c.autoSaveToLibrary({ title: d.title, body: d.btcInsight, sourceType: 'history_insight' });
      break;
    }
    case 'zoomOut': {
      const d = toZoomOutDisplayData(data);
      c.setZoomOut(d);
      const { title, body } = zoomOutLibraryAutosaveFromDisplayData(d);
      void c.autoSaveToLibrary({ title, body, sourceType: 'zoom_out' });
      break;
    }
  }
}

function pushRecencyForOrchestrateSlot(slot: RegenerateCompanionSlot, data: unknown): void {
  switch (slot) {
    case 'signal': {
      const d = data as { title: string; source: string; url?: string };
      updateRecencyHints('signal_title', d.title);
      updateRecencyHints('signal_source', d.source);
      if (d.url) updateRecencyHints('signal_url', d.url);
      break;
    }
    case 'grounding': {
      const d = data as { title: string; url: string };
      updateRecencyHints('grounding', d.title);
      const gHost = hostnameFromUrl(d.url);
      if (gHost) updateRecencyHints('grounding_source', gHost);
      break;
    }
    case 'history': {
      const d = data as { title: string };
      updateRecencyHints('history', d.title);
      break;
    }
    case 'zoomOut': {
      const t = toZoomOutDisplayData(data).deepTime?.title;
      if (t) updateRecencyHints('zoomOut', t);
      break;
    }
  }
}

/** Server returned a slot alongside intervention — no recency or cacheId updates. */
export function hydrateOrchestrateSlotIfNew(
  slot: RegenerateCompanionSlot,
  r: CompanionOrchestrateSlotResult | null | undefined,
  fetchedSlots: Set<string>,
  c: CompanionSlotCommitters,
  setCacheRelaxations?: (fn: (prev: CompanionSlotRelaxations) => CompanionSlotRelaxations) => void,
): void {
  if (!isFilledOrchestrateSlot(r) || fetchedSlots.has(slot)) return;
  fetchedSlots.add(slot);
  commitOrchestrateSlotData(slot, r.data, c);
  trackCompanionServed(slot, r.source);
  if (setCacheRelaxations) {
    const field = SLOT_CACHE_KEY[slot];
    setCacheRelaxations((prev) => ({ ...prev, [field]: toSlotRelaxationUi(r.cacheRelaxation) }));
  }
}

/** After lazy fetch or regenerate — state, optional cache row id, recency. */
export function applyOrchestrateSlotLazyOrRegenerate(
  slot: RegenerateCompanionSlot,
  r: CompanionOrchestrateSlotResult & { data: NonNullable<CompanionOrchestrateSlotResult['data']> },
  setCacheIds: (fn: (prev: CompanionSlotCacheIds) => CompanionSlotCacheIds) => void,
  c: CompanionSlotCommitters,
  setCacheRelaxations?: (fn: (prev: CompanionSlotRelaxations) => CompanionSlotRelaxations) => void,
): void {
  commitOrchestrateSlotData(slot, r.data, c);
  trackCompanionServed(slot, r.source);
  if (r.cacheId) {
    const field = SLOT_CACHE_KEY[slot];
    setCacheIds((prev) => ({ ...prev, [field]: r.cacheId }));
  }
  if (setCacheRelaxations) {
    const field = SLOT_CACHE_KEY[slot];
    setCacheRelaxations((prev) => ({ ...prev, [field]: toSlotRelaxationUi(r.cacheRelaxation) }));
  }
  pushRecencyForOrchestrateSlot(slot, r.data);
}
