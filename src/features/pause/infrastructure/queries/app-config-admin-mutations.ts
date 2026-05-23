import { supabase } from '@/integrations/supabase/client';

/** Admin: upsert one `app_config` row (RLS + admin policy). */
export async function upsertAppConfigRow(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('app_config' as never)
    .upsert({ key, value } as never, { onConflict: 'key' } as never);
  if (error) throw error;
}
