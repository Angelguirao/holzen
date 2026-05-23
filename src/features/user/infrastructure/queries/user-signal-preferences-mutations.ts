import { supabase } from '@/integrations/supabase/client';
import type { UserSignalPreference } from '@/features/user/domain/user-signal-preference';

export async function updateUserSignalPreferenceActive(
  prefId: string,
  active: boolean,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('user_signal_preferences')
    .update({ active })
    .eq('id', prefId);
  return { error: error ? new Error(error.message) : null };
}

export async function insertCatalogSignalPreference(input: {
  userId: string;
  sourceId: string;
  category: string;
  active: boolean;
}): Promise<{ data: UserSignalPreference | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_signal_preferences')
    .insert({
      user_id: input.userId,
      source_id: input.sourceId,
      active: input.active,
      category: input.category,
    })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as unknown as UserSignalPreference, error: null };
}

export async function insertCustomUserSignalPreference(input: {
  userId: string;
  customName: string;
  customUrl: string | null;
  customType: string;
  category: string;
}): Promise<{ data: UserSignalPreference | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_signal_preferences')
    .insert({
      user_id: input.userId,
      source_id: null,
      custom_name: input.customName,
      custom_url: input.customUrl,
      custom_type: input.customType,
      active: true,
      category: input.category,
    })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as unknown as UserSignalPreference, error: null };
}

export async function deleteUserSignalPreference(prefId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('user_signal_preferences').delete().eq('id', prefId);
  return { error: error ? new Error(error.message) : null };
}
