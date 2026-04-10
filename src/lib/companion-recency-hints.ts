/** Keys spread into `companion-orchestrate` body for client-side dedup hints. */
export interface CompanionRecencyHintsPayload {
  recentSignalSources: string[];
  recentSignalTitles: string[];
  recentSignalUrls: string[];
  recentNudgeTopics: string[];
  recentGroundingSources: string[];
  recentHistoryTitles: string[];
  recentZoomOutTitles: string[];
}

function safeGetStringArray(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]') as unknown;
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function getRecencyHints(): CompanionRecencyHintsPayload {
  return {
    recentSignalSources: safeGetStringArray('holzen_recent_signal_sources'),
    recentSignalTitles: safeGetStringArray('holzen_recent_signal_titles'),
    recentSignalUrls: safeGetStringArray('holzen_recent_signal_urls'),
    recentNudgeTopics: safeGetStringArray('holzen_recent_nudge_topics'),
    recentGroundingSources: safeGetStringArray('holzen_recent_grounding_sources'),
    recentHistoryTitles: safeGetStringArray('holzen_recent_history_titles'),
    recentZoomOutTitles: safeGetStringArray('holzen_recent_zoom_out_titles'),
  };
}

const RECENCY_KEY_BY_TYPE: Record<string, string> = {
  signal_title: 'holzen_recent_signal_titles',
  signal_source: 'holzen_recent_signal_sources',
  signal_url: 'holzen_recent_signal_urls',
  grounding: 'holzen_recent_nudge_topics',
  grounding_source: 'holzen_recent_grounding_sources',
  history: 'holzen_recent_history_titles',
  zoomOut: 'holzen_recent_zoom_out_titles',
};

/** Push a value onto the front of the capped list for the given hint kind. */
export function updateRecencyHints(type: string, value: string): void {
  if (!value) return;
  const storageKey = RECENCY_KEY_BY_TYPE[type];
  if (!storageKey) return;
  try {
    const prev = safeGetStringArray(storageKey);
    const updated = [value, ...prev.filter((s) => s !== value)].slice(0, 5);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}
