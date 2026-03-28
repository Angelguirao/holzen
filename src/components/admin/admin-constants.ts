export const TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  ground_nudge: 'Grounding',
  historical_insight: 'History',
  zoom_out: 'Zoom Out',
  zoom_out_deep_time: 'Zoom Out',
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
  reflection: '#6366f1',
};

export function label(type: string | null): string {
  return TYPE_LABELS[type ?? ''] ?? type ?? 'Unknown';
}

export const PERIOD_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: '7d' as const, label: '7 days' },
  { value: '30d' as const, label: '30 days' },
  { value: 'all' as const, label: 'All time' },
];

export const TAB_TRIGGER_CLASS =
  'text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary';
