import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useHolzenHomeContextState } from '@/features/pause/public-hooks';

export type HolzenContextValue = ReturnType<typeof useHolzenHomeContextState>;

const HolzenContext = createContext<HolzenContextValue | null>(null);

/** One shared pause/profile/market tree for the signed-in session (survives tab switches). */
export function HolzenProvider({ children }: { children: ReactNode }) {
  const value = useHolzenHomeContextState();
  return createElement(HolzenContext.Provider, { value }, children);
}

export function useHolzen(): HolzenContextValue {
  const ctx = useContext(HolzenContext);
  if (!ctx) {
    throw new Error('useHolzen must be used within HolzenProvider');
  }
  return ctx;
}
