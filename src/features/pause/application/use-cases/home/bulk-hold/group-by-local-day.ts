import type { TFunction } from 'i18next';
import type { BulkHoldPendingPause, BulkHoldReviewSection } from '@/features/pause/domain/bulk-hold';

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
