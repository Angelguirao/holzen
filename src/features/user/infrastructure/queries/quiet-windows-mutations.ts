import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { QuietWindow } from '@/features/user/infrastructure/queries/quiet-windows-query';

type QuietWindowUpdate = Database['public']['Tables']['quiet_windows']['Update'];

export async function insertQuietWindow(input: {
  userId: string;
  label: string;
  start_hour: number;
  end_hour: number;
  days: number[];
  active: boolean;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('quiet_windows').insert({
    user_id: input.userId,
    label: input.label,
    start_hour: input.start_hour,
    end_hour: input.end_hour,
    days: input.days,
    active: input.active,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function updateQuietWindow(
  id: string,
  updates: Partial<QuietWindow>,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('quiet_windows')
    .update(updates as QuietWindowUpdate)
    .eq('id', id);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteQuietWindow(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('quiet_windows').delete().eq('id', id);
  return { error: error ? new Error(error.message) : null };
}
