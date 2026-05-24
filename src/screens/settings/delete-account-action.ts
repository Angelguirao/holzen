import { getAuthUser, signOutAuth } from '@/features/auth/public';
import { deleteAccount as invokeDeleteAccount } from '@/features/auth/public-rpc';

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
