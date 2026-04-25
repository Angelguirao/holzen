import type { EchoUserWord, ZoomOutData, ZoomOutEchoData } from '@/components/ZoomOutDisplay';

function parseEchoUserWords(raw: unknown): EchoUserWord[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: EchoUserWord[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if (r.kind !== 'note' && r.kind !== 'replay') continue;
    if (typeof r.body !== 'string' || typeof r.created_at !== 'string') continue;
    out.push({ kind: r.kind, body: r.body, created_at: r.created_at });
  }
  return out.length ? out : undefined;
}

function parseEcho(raw: unknown): ZoomOutEchoData | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const created_at = typeof e.created_at === 'string' ? e.created_at : '';
  const mood = typeof e.mood === 'string' || e.mood === null ? (e.mood as string | null) : null;
  const outcome = typeof e.outcome === 'string' || e.outcome === null ? (e.outcome as string | null) : null;
  const userWords = parseEchoUserWords(e.userWords);
  return {
    id: typeof e.id === 'string' ? e.id : undefined,
    message: typeof e.message === 'string' ? e.message : undefined,
    created_at,
    mood,
    outcome,
    context: typeof e.context === 'string' || e.context === null ? (e.context as string | null) : undefined,
    aiPrompt: typeof e.aiPrompt === 'string' || e.aiPrompt === null ? (e.aiPrompt as string | null) : undefined,
    userWords,
  };
}

/**
 * Coerces wire/cache/orchestrate payloads into the shape `ZoomOutDisplay` expects.
 * Missing fields default to empty so the UI never reads undefined arrays.
 */
export function toZoomOutDisplayData(raw: unknown): ZoomOutData {
  if (!raw || typeof raw !== 'object') {
    return { onThisDay: [], currentPrice: null, echo: null, deepTime: null };
  }
  const o = raw as Record<string, unknown>;

  const onThisDay: ZoomOutData['onThisDay'] = [];
  if (Array.isArray(o.onThisDay)) {
    for (const row of o.onThisDay) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      if (
        typeof r.yearsAgo === 'number' &&
        typeof r.price === 'number' &&
        typeof r.date === 'string'
      ) {
        onThisDay.push({ yearsAgo: r.yearsAgo, price: r.price, date: r.date });
      }
    }
  }

  const currentPrice = typeof o.currentPrice === 'number' ? o.currentPrice : null;
  const echo = parseEcho(o.echo);

  let deepTime: ZoomOutData['deepTime'] = null;
  if (o.deepTime && typeof o.deepTime === 'object') {
    const d = o.deepTime as Record<string, unknown>;
    if (typeof d.title === 'string' && typeof d.body === 'string') {
      deepTime = { title: d.title, body: d.body };
    }
  }

  const partial = typeof o.partial === 'boolean' ? o.partial : undefined;

  return { onThisDay, currentPrice, echo, deepTime, partial };
}

/**
 * One-line preview for library list cards from a stored `zoom_out` JSON `body`.
 * Returns `null` when JSON is invalid so callers can keep the raw string (truncated elsewhere).
 */
export function zoomOutBodyPreviewFromJsonString(raw: string): string | null {
  try {
    const d = toZoomOutDisplayData(JSON.parse(raw));
    const line = d.deepTime?.body || d.echo?.message || d.deepTime?.title;
    return line || 'Zoom Out';
  } catch {
    return null;
  }
}

/** Title + body for companion library autosave (orchestrate commit + artifact cache hydrate). */
export function zoomOutLibraryAutosaveFromDisplayData(d: ZoomOutData): { title: string; body: string } {
  return {
    title: d.deepTime?.title || 'Zoom Out',
    body: d.deepTime?.body || d.echo?.message || 'Zoom Out perspective',
  };
}

/** Character count for ReadTime-style estimates on the zoom-out full view. */
export function zoomOutTotalCharsForReadTime(d: ZoomOutData | null | undefined): number {
  if (!d) return 0;
  return (d.deepTime?.title?.length ?? 0) + (d.deepTime?.body?.length ?? 0) + (d.echo?.message?.length ?? 0);
}

/** Seeds for SaveThisMoment — caller supplies i18n default when `deepTimeTitle` is missing. */
export function zoomOutSaveThisMomentSeed(d: ZoomOutData): {
  deepTimeTitle: string | undefined;
  context: string;
} {
  return {
    deepTimeTitle: d.deepTime?.title,
    context: d.deepTime?.body ?? d.echo?.message ?? '',
  };
}
