import type { AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkSignupGate, type SignupGateStatus } from './signup-gate';

export type AuthMutationResult = { error: Error | null };

/** App entry — signup cap gate via browser Supabase client. */
export async function checkSignupGateForApp(): Promise<SignupGateStatus> {
  return checkSignupGate(supabase);
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  emailRedirectTo: string,
): Promise<AuthMutationResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  return { error: error ?? null };
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthMutationResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ?? null };
}

export async function resetPasswordForEmail(
  email: string,
  redirectTo: string,
): Promise<AuthMutationResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error ?? null };
}

export async function updateUserPassword(password: string): Promise<AuthMutationResult> {
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error ?? null };
}

export async function updateUserEmail(email: string): Promise<AuthMutationResult> {
  const { error } = await supabase.auth.updateUser({ email });
  return { error: error ?? null };
}

/** Subscribe until `PASSWORD_RECOVERY`; returns unsubscribe. */
export function subscribePasswordRecoveryReady(onRecovery: () => void): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
    if (event === 'PASSWORD_RECOVERY') onRecovery();
  });
  return () => subscription.unsubscribe();
}
