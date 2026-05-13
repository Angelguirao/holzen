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
  signal: 'hsl(var(--primary) / 0.8)',
  ground_nudge: 'hsl(var(--secondary-foreground) / 0.8)',
  historical_insight: 'hsl(var(--muted-foreground) / 0.8)',
  zoom_out: 'hsl(var(--accent-foreground) / 0.7)',
  zoom_out_deep_time: 'hsl(var(--foreground) / 0.75)',
  reflection: 'hsl(var(--ring) / 0.8)',
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

/** Tailwind classes for companion_serves.serve_source badges.
 *  `library` = content_library (curated catalog); `cache` = runtime companion_cache.
 *  They're visually distinct so admins can tell which pool served a row. */
export function serveSourceBadgeClass(source: string | null | undefined): string {
  if (!source) return 'bg-muted/25 text-muted-foreground/40';
  switch (source) {
    case 'live':
      return 'bg-muted/50 text-foreground';
    case 'library':
      return 'bg-muted/40 text-nox-text-link ring-1 ring-border/60';
    case 'cache':
      return 'bg-secondary text-secondary-foreground/80';
    case 'curated':
      return 'bg-accent text-accent-foreground/80';
    case 'empty':
      return 'bg-destructive/10 text-destructive/75';
    default:
      return 'bg-muted/30 text-muted-foreground/50';
  }
}

export const PERIOD_OPTIONS = [
  { value: 'today' as const, label: 'Today' },
  { value: '7d' as const, label: '7 days' },
  { value: '30d' as const, label: '30 days' },
  { value: 'all' as const, label: 'All time' },
];

export const TAB_TRIGGER_CLASS =
  'text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full data-[state=active]:bg-muted/55 data-[state=active]:text-foreground';
