import type { Database } from '@/integrations/supabase/types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
