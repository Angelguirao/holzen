/**
 * Auth provider-adjacent hooks and side effects — use from presentation inside
 * the auth feature via relative import; app/screens use `@/features/auth/public`.
 */
export { runSignedInSideEffects } from './infrastructure/auth-signed-in-side-effects';
