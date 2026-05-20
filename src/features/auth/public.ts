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
export {
  SIGNUPS_ENABLED,
  checkSignupGate,
  type SignupGateStatus,
} from './infrastructure/signup-gate';
export {
  checkSignupGateForApp,
  resetPasswordForEmail,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  subscribePasswordRecoveryReady,
  updateUserPassword,
  type AuthMutationResult,
} from './infrastructure/supabase-auth-operations';
