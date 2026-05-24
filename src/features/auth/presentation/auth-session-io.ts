/**
 * Auth session presentation I/O — Supabase session wiring, funnel + observability for `AuthProvider`.
 */
export {
  checkSignupGateForApp,
  getAuthSession,
  getAuthUser,
  resetPasswordForEmail,
  signInWithEmailPassword,
  signInWithOAuthGoogle,
  signOutAuth,
  signUpWithEmailPassword,
  subscribeAuthStateChange,
  subscribePasswordRecoveryReady,
  updateUserEmail,
  updateUserPassword,
  type AuthMutationResult,
} from '@/features/auth/infrastructure/supabase-auth-operations';
export {
  SIGNUPS_ENABLED,
  checkSignupGate,
  type SignupGateStatus,
} from '@/features/auth/infrastructure/signup-gate';
export { handleAuthFunnelEvents } from '@/features/auth/application/auth-funnel-events';
export type { AuthFunnelUser } from '@/features/auth/application/auth-funnel-events';
export {
  identifyAuthenticatedUser,
  syncAuthObservability,
} from '@/features/auth/application/auth-observability';
