import type { PauseState } from '@/features/pause/domain/pause-state';
import { PAUSE_OPEN_MAX_AGE_MS } from '@/features/pause/application/use-cases/session/open-max-countdown';

export const PAUSE_CALM_SETTLED_AT_METADATA_KEY = 'calm_settled_at';

export function parsePauseCalmSettledAt(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const raw = metadata?.[PAUSE_CALM_SETTLED_AT_METADATA_KEY];
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return Number.isNaN(Date.parse(raw)) ? null : raw;
}

/** Mirrors `pause_open_max_anchor_at` in Postgres. Returns null when open_max does not apply yet. */
export function resolvePauseOpenMaxAnchorAt(input: {
  state: PauseState;
  source?: string | null;
  engaged_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}): string | null {
  if (input.state !== 'engaged') return null;

  if (input.source === 'cron_volatility') {
    return parsePauseCalmSettledAt(input.metadata);
  }

  return input.engaged_at ?? input.created_at;
}

export function isPauseOpenMaxExpired(
  input: Parameters<typeof resolvePauseOpenMaxAnchorAt>[0],
  nowMs: number,
): boolean {
  const anchor = resolvePauseOpenMaxAnchorAt(input);
  if (!anchor) return false;
  return new Date(anchor).getTime() + PAUSE_OPEN_MAX_AGE_MS <= nowMs;
}
