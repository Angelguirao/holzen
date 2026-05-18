/** Public API for auth — export only what other features may import. */
import type { User } from '@supabase/supabase-js';

/**
 * Shape exposed by `AuthProvider` / `useAuth`.
 * React provider: `@/features/auth/presentation/AuthProvider` (re-exported from `@/hooks/use-auth`).
 */
export interface AuthSessionState {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export type { AuthFunnelUser } from './application/auth-funnel-events';
