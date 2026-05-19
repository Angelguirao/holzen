import { supabase } from '@/integrations/supabase/client';
import { ADMIN_QUERY_PREFIX } from '@/screens/admin/lib/admin-query-namespace';

export interface AppliedMigrationRow {
  version: string;
  name: string;
  statements_count: number;
}

export const ADMIN_APPLIED_MIGRATIONS_QUERY_LEAF = 'applied-migrations' as const;

export const ADMIN_APPLIED_MIGRATIONS_QUERY_KEY = [
  ...ADMIN_QUERY_PREFIX,
  ADMIN_APPLIED_MIGRATIONS_QUERY_LEAF,
] as const;

export async function fetchAppliedMigrations(): Promise<AppliedMigrationRow[]> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: { p_limit: number },
  ) => Promise<{ data: AppliedMigrationRow[] | null; error: { message: string } | null }>)(
    'get_applied_migrations',
    { p_limit: 20 },
  );
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function getAdminAppliedMigrationsQueryOptions() {
  return {
    queryKey: ADMIN_APPLIED_MIGRATIONS_QUERY_KEY,
    queryFn: fetchAppliedMigrations,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
