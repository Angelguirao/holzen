import type { TFunction } from 'i18next';

/** Expired pause rows eligible for retrospective outcome logging from Home. */
export interface BulkHoldPendingPause {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
}

export type BulkHoldOutcomeChoice = 'held' | 'bought' | 'sold';

export interface BulkHoldReviewSection {
  label: string;
  items: BulkHoldPendingPause[];
}

const WINDOW_DAYS = 14;
const MAX_ROWS = 50;

export const bulkHoldQueryWindowIso = (): string =>
  new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

export const bulkHoldMaxRows = MAX_ROWS;

function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDaySectionLabel(iso: string, language: string, t: TFunction): string {
  const d = new Date(iso);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return t('bulkHold.sectionToday', { defaultValue: 'Today' });
  }
  return d.toLocaleDateString(language, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function groupBulkHoldByLocalDay(
  items: BulkHoldPendingPause[],
  language: string,
  t: TFunction,
): BulkHoldReviewSection[] {
  const map = new Map<string, BulkHoldPendingPause[]>();
  for (const p of items) {
    const key = localDayKey(p.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return keys.map((key) => {
    const list = map.get(key)!;
    const first = list[0];
    return { label: formatDaySectionLabel(first.created_at, language, t), items: list };
  });
}

export function parseBulkHoldChange24hPct(snapshot: Record<string, unknown> | null | undefined): number | null {
  if (!snapshot) return null;
  const v = snapshot.change_24h_pct;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatBulkHoldContextQuote(snapshot: Record<string, unknown> | null | undefined, max = 80): string | null {
  const text = snapshot && typeof snapshot.context_text === 'string' ? snapshot.context_text.trim() : '';
  if (!text) return null;
  const ellip = text.length > max ? `${text.slice(0, max - 1)}…` : text;
  return `“${ellip}”`;
}

export function formatBulkHoldLocalTime(iso: string, language: string): string {
  return new Date(iso).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
}
