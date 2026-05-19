/** Public API for auth — export only what other features may import. */
import type { User } from '@supabase/supabase-js';

export { AuthProvider, useAuth } from './presentation/AuthProvider';

/**
 * Shape exposed by `AuthProvider` / `useAuth`.
 */
export interface AuthSessionState {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export type { AuthFunnelUser } from './application/auth-funnel-events';
