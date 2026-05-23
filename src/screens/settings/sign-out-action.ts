import { supabase } from '@/integrations/supabase/client';

export type SignOutActionState = {
  error?: 'sign_out_failed';
  success?: boolean;
};

export async function signOutAction(
  _prev: SignOutActionState,
  _formData: FormData,
): Promise<SignOutActionState> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: 'sign_out_failed' };
  }
  return { success: true };
}
