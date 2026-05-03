import { useMemo } from 'react';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';

/** Parsed preview lines for the main pause context and the pinned preview row. */
export function useHomePauseContextPreviews(args: {
  context: string | null;
  pinnedContext: string | null;
}) {
  const { context, pinnedContext } = args;

  const pauseContextHomePreview = useMemo(() => parsePauseContextForHomePreview(context), [context]);

  const pinnedContextHomePreview = useMemo(
    () => parsePauseContextForHomePreview(pinnedContext),
    [pinnedContext],
  );

  return { pauseContextHomePreview, pinnedContextHomePreview };
}
