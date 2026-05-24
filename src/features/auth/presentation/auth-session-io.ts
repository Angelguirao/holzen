/**
 * Auth session presentation I/O — funnel + observability side effects for `AuthProvider`.
 */
export { handleAuthFunnelEvents } from '@/features/auth/application/auth-funnel-events';
export type { AuthFunnelUser } from '@/features/auth/application/auth-funnel-events';
export {
  identifyAuthenticatedUser,
  syncAuthObservability,
} from '@/features/auth/application/auth-observability';
