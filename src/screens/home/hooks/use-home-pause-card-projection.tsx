import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseCardBody } from '@/screens/home/components/HomePauseCardBody';
import { SnoozeToolbarControl } from '@/screens/home/components/SnoozeControl';
import {
  usePauseCardProjection,
  type UsePauseCardProjectionParams,
} from '@/features/pause/public-hooks';

export type UseHomePauseCardProjectionParams = UsePauseCardProjectionParams;

/** Screen conductor: pause card projection + Home route components (snooze + body). */
export function useHomePauseCardProjection(params: UseHomePauseCardProjectionParams) {
  const { showSnoozeToolbar, pauseCardBodyProps } = usePauseCardProjection(params);

  const pauseSectionHeaderRight = useMemo((): ReactNode | undefined => {
    if (!showSnoozeToolbar) return undefined;
    return <SnoozeToolbarControl />;
  }, [showSnoozeToolbar]);

  const pauseCardBody = useMemo(
    () => <HomePauseCardBody {...pauseCardBodyProps} />,
    [pauseCardBodyProps],
  );

  return { pauseSectionHeaderRight, pauseCardBody };
}
