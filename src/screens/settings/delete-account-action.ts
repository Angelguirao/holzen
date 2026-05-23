import { deleteAccount as invokeDeleteAccount } from '@/features/auth/public-rpc';
import { supabase } from '@/integrations/supabase/client';

export type DeleteAccountActionState = {
  error?: 'not_authenticated' | 'delete_failed';
  success?: boolean;
};

export async function deleteAccountAction(
  _prev: DeleteAccountActionState,
  _formData: FormData,
): Promise<DeleteAccountActionState> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'not_authenticated' };
  }

  const { error } = await invokeDeleteAccount();
  if (error) {
    return { error: 'delete_failed' };
  }

  await supabase.auth.signOut();
  return { success: true };
}
