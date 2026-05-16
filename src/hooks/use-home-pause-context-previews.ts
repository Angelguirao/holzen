import { useMemo } from 'react';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';

/** Parsed preview lines for the open pause context on Home. */
export function useHomePauseContextPreviews(context: string | null) {
  return useMemo(() => parsePauseContextForHomePreview(context), [context]);
}
