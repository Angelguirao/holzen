/**
 * Auth session presentation I/O — Supabase session wiring, funnel + observability for `AuthProvider`.
 */
export {
  getAuthSession,
  signOutAuth,
  subscribeAuthStateChange,
} from '@/features/auth/infrastructure/supabase-auth-operations';
export { handleAuthFunnelEvents } from '@/features/auth/application/auth-funnel-events';
export type { AuthFunnelUser } from '@/features/auth/application/auth-funnel-events';
export {
  identifyAuthenticatedUser,
  syncAuthObservability,
} from '@/features/auth/application/auth-observability';
