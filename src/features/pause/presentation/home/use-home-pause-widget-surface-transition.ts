import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { HomePauseWidgetSurface } from '@/features/pause/domain/home/home-pause-widget-surface';
import { resolveHomePauseWidgetExpandedAfterSurfaceChange } from '@/features/pause/domain/home/home-pause-widget-expand-preference';

/** Sync expand preference when widget surface changes (open pause arrives, ends, manual cooldown → idle). */
export function useHomePauseWidgetSurfaceTransition(input: {
  surface: HomePauseWidgetSurface;
  newPauseArrival: boolean;
  userId: string | undefined;
  setUserExpanded: Dispatch<SetStateAction<boolean>>;
}) {
  const prevSurfaceRef = useRef<HomePauseWidgetSurface | null>(null);

  useEffect(() => {
    const previousSurface = prevSurfaceRef.current;
    prevSurfaceRef.current = input.surface;

    input.setUserExpanded((current) =>
      resolveHomePauseWidgetExpandedAfterSurfaceChange({
        previousSurface,
        nextSurface: input.surface,
        newPauseArrival: input.newPauseArrival,
        currentExpanded: current,
        hasUserId: Boolean(input.userId),
      }),
    );
  }, [input.surface, input.newPauseArrival, input.userId, input.setUserExpanded]);
}
