import type { PauseState } from '@/features/pause/domain/pause-state';
import { PAUSE_OPEN_MAX_AGE_MS } from '@/features/pause/application/use-cases/session/open-max-countdown';

export const PAUSE_CALM_SETTLED_AT_METADATA_KEY = 'calm_settled_at';
export const PAUSE_PENDING_OFFERED_AT_METADATA_KEY = 'pending_offered_at';

function parsePauseMetadataTimestamp(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const raw = metadata?.[key];
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return Number.isNaN(Date.parse(raw)) ? null : raw;
}

export function parsePauseCalmSettledAt(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  return parsePauseMetadataTimestamp(metadata, PAUSE_CALM_SETTLED_AT_METADATA_KEY);
}

export function parsePausePendingOfferedAt(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  return parsePauseMetadataTimestamp(metadata, PAUSE_PENDING_OFFERED_AT_METADATA_KEY);
}

/** Latest context-shift anchor — mirrors `pause_open_max_anchor_at` in Postgres. */
export function resolvePauseOpenMaxAnchorAt(input: {
  state: PauseState;
  source?: string | null;
  engaged_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}): string | null {
  if (input.state !== 'engaged') return null;

  const anchors = [
    parsePauseCalmSettledAt(input.metadata),
    parsePausePendingOfferedAt(input.metadata),
  ].filter((value): value is string => value != null);

  if (anchors.length === 0) return null;

  return anchors.reduce((latest, current) =>
    Date.parse(current) > Date.parse(latest) ? current : latest,
  );
}

export function isPauseOpenMaxExpired(
  input: Parameters<typeof resolvePauseOpenMaxAnchorAt>[0],
  nowMs: number,
): boolean {
  const anchor = resolvePauseOpenMaxAnchorAt(input);
  if (!anchor) return false;
  return new Date(anchor).getTime() + PAUSE_OPEN_MAX_AGE_MS <= nowMs;
}
