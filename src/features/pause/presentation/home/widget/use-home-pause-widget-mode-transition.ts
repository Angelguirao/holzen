import { useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { HomePauseWidgetMode } from '@/features/pause/domain/home/home-pause-widget-mode';
import { resolveHomePauseWidgetExpandedAfterModeChange } from '@/features/pause/domain/home/home-pause-widget-collapse-rules';

/** Sync expand preference when Figma mode changes (B/C arrival, open pause ends, D → A). */
export function useHomePauseWidgetModeTransition(input: {
  widgetMode: HomePauseWidgetMode;
  newPauseArrival: boolean;
  userId: string | undefined;
  setUserExpanded: Dispatch<SetStateAction<boolean>>;
}) {
  const prevModeRef = useRef<HomePauseWidgetMode | null>(null);

  useEffect(() => {
    const previousMode = prevModeRef.current;
    prevModeRef.current = input.widgetMode;

    input.setUserExpanded((current) =>
      resolveHomePauseWidgetExpandedAfterModeChange({
        previousMode,
        nextMode: input.widgetMode,
        newPauseArrival: input.newPauseArrival,
        currentExpanded: current,
        hasUserId: Boolean(input.userId),
      }),
    );
  }, [input.widgetMode, input.newPauseArrival, input.userId, input.setUserExpanded]);
}
