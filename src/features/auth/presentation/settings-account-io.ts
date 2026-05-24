/**
 * Settings account form actions (sign out, delete account) — wires auth infrastructure for screens.
 */
import { deleteAccount as invokeDeleteAccount } from '@/features/auth/infrastructure/edge/delete-account-edge';
import { getAuthUser, signOutAuth } from '@/features/auth/infrastructure/supabase-auth-operations';

export type SignOutActionState = {
  error?: 'sign_out_failed';
  success?: boolean;
};

export async function signOutAction(
  _prev: SignOutActionState,
  _formData: FormData,
): Promise<SignOutActionState> {
  const { error } = await signOutAuth();
  if (error) {
    return { error: 'sign_out_failed' };
  }
  return { success: true };
}

export type DeleteAccountActionState = {
  error?: 'not_authenticated' | 'delete_failed';
  success?: boolean;
};

export async function deleteAccountAction(
  _prev: DeleteAccountActionState,
  _formData: FormData,
): Promise<DeleteAccountActionState> {
  const user = await getAuthUser();
  if (!user) {
    return { error: 'not_authenticated' };
  }

  const { error } = await invokeDeleteAccount();
  if (error) {
    return { error: 'delete_failed' };
  }

  await signOutAuth();
  return { success: true };
}
