import { useMemo } from 'react';
import { parsePauseContextForHomePreview } from '@/features/market/public';

/** Parsed preview lines for the open pause context on Home. */
export type PauseContextHomePreview = {
  btc24h: string | null;
  marketSentiment: string | null;
};

/** Parsed preview lines for the open pause context on Home. */
export function usePauseContextHomePreviews(context: string | null): PauseContextHomePreview {
  return useMemo(() => parsePauseContextForHomePreview(context), [context]);
}
