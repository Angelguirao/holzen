import type { ReactNode } from 'react';
import {
  PauseHomeProvider,
  usePauseHomeContext,
  type PauseHomeContextValue,
} from '@/features/pause/public-home';

export type HolzenContextValue = PauseHomeContextValue;

/** App-shell alias for {@link PauseHomeProvider} (signed-in pause + market context). */
export function HolzenProvider({ children }: { children: ReactNode }) {
  return <PauseHomeProvider>{children}</PauseHomeProvider>;
}

/** @deprecated Prefer `usePauseHomeContext` from `@/features/pause/public-home`. */
export function useHolzen(): HolzenContextValue {
  return usePauseHomeContext();
}
