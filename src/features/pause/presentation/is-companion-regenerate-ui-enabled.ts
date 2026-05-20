import { isHolzenDebugEnabled } from '@/lib/holzen-console';

/** Orchestrate regenerate — dev / non-production builds, or prod + Holzen debug opt-in. */
export function isCompanionRegenerateUiEnabled(): boolean {
  return !import.meta.env.PROD || isHolzenDebugEnabled();
}
