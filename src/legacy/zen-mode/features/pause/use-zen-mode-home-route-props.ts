import { useMemo } from 'react';
import {
  buildZenModeHomeRouteProps,
  type BuildZenModeHomeRoutePropsInput,
  type ZenModeHomeRoutePropsProjection,
} from '@/legacy/zen-mode/features/pause/zen-mode/build-zen-mode-home-route-props';

/** Memoized zen route props for {@link HomeZenModeRoute} / {@link ZenModeHome}. */
export function useZenModeHomeRouteProps(
  input: BuildZenModeHomeRoutePropsInput,
): ZenModeHomeRoutePropsProjection {
  return useMemo(() => buildZenModeHomeRouteProps(input), [input]);
}
