import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useHolzenHomeContextState } from './use-holzen-home-context-state';

export type PauseHomeContextValue = ReturnType<typeof useHolzenHomeContextState>;

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
