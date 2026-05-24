import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useHolzenHomeContextState } from './use-holzen-home-context-state';
import type { PauseHomeContextValue } from '@/features/pause/domain/home/pause-home-context-value';

export type { PauseHomeContextValue } from '@/features/pause/domain/home/pause-home-context-value';

const PauseHomeContext = createContext<PauseHomeContextValue | null>(null);

/** Shared pause + market home state for signed-in shell (survives tab switches). */
export function PauseHomeProvider({ children }: { children: ReactNode }) {
  const value = useHolzenHomeContextState();
  return createElement(PauseHomeContext.Provider, { value }, children);
}

export function usePauseHomeContext(): PauseHomeContextValue {
  const ctx = useContext(PauseHomeContext);
  if (!ctx) {
    throw new Error('usePauseHomeContext must be used within PauseHomeProvider');
  }
  return ctx;
}
