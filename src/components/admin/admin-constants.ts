export const TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  ground_nudge: 'Grounding',
  historical_insight: 'History',
  /** Timeline / market-context zoom (distinct from deep-time variant in DB). */
  zoom_out: 'Zoom Out (timeline)',
  /** Deep-time / civilizational zoom — separate rows in analytics from timeline zoom. */
  zoom_out_deep_time: 'Zoom Out (deep time)',
  reflection: 'Reflection',
  grounding: 'Grounding',
  learning: 'Grounding',
  history_insight: 'History',
  haiku: 'Haiku',
};

export const TYPE_COLORS: Record<string, string> = {
  signal: '#8b5cf6',
  ground_nudge: '#06b6d4',
  historical_insight: '#f59e0b',
  zoom_out: '#10b981',
  zoom_out_deep_time: '#059669',
  reflection: '#6366f1',
};

export function label(type: string | null): string {
  return TYPE_LABELS[type ?? ''] ?? type ?? 'Unknown';
}

/** Short model name for generation health rows (avoid duplicate titles when only model differs). */
export function shortModelName(model: string | null | undefined): string {
  if (!model) return '';
  const m = model.replace(/^google\//, '');
  return m.length > 28 ? `${m.slice(0, 26)}…` : m;
}

export const PERIOD_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: '7d' as const, label: '7 days' },
  { value: '30d' as const, label: '30 days' },
  { value: 'all' as const, label: 'All time' },
];

export const TAB_TRIGGER_CLASS =
  'text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary';
