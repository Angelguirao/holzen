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

export { readThrownMessage } from './application/read-thrown-message';
export type { AuthFunnelUser } from './presentation/auth-session-io';
export {
  SIGNUPS_ENABLED,
  checkSignupGate,
  checkSignupGateForApp,
  getAuthUser,
  resetPasswordForEmail,
  signInWithEmailPassword,
  signInWithOAuthGoogle,
  signOutAuth,
  signUpWithEmailPassword,
  subscribePasswordRecoveryReady,
  updateUserEmail,
  updateUserPassword,
  type AuthMutationResult,
  type SignupGateStatus,
} from './presentation/auth-session-io';
export {
  deleteAccountAction,
  signOutAction,
  type DeleteAccountActionState,
  type SignOutActionState,
} from './presentation/settings-account-io';
export {
  changeEmailAction,
  changePasswordAction,
  type ChangeEmailActionState,
  type ChangePasswordActionState,
} from './presentation/settings-credentials-io';
export {
  emailAuthAction,
  forgotPasswordAction,
  resetPasswordAction,
  type AuthActionState,
  type ResetPasswordActionState,
} from './presentation/marketing-auth-actions-io';
export {
  emailUnsubscribeAction,
  type UnsubscribeActionState,
} from './presentation/email-unsubscribe-io';
