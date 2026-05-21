import { useMemo } from 'react';
import {
  buildZenModeHomeRouteProps,
  type BuildZenModeHomeRoutePropsInput,
  type ZenModeHomeRoutePropsProjection,
} from '@/features/pause/public-home';

/** Memoized zen route props for {@link HomeZenModeRoute} / {@link ZenModeHome}. */
export function useZenModeHomeRouteProps(
  input: BuildZenModeHomeRoutePropsInput,
): ZenModeHomeRoutePropsProjection {
  return useMemo(() => buildZenModeHomeRouteProps(input), [input]);
}
