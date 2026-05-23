import { supabase } from '@/integrations/supabase/client';

const RLS_HINT =
  'No rows were deleted. Apply pending Supabase migrations for admin policies on this table, and ensure profiles.is_admin is true for your user.';

type PauseAdminDeleteTable = 'companion_cache' | 'generation_attempts';

/**
 * Chunked delete with row count: PostgREST returns 204 even when RLS deletes 0 rows;
 * selecting returned ids surfaces that case.
 */
async function deleteRowsByIds(
  table: PauseAdminDeleteTable,
  ids: string[],
  chunkSize: number,
): Promise<{ deleted: number; errorMessage: string | null }> {
  let deleted = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(table).delete().in('id', slice).select('id');
    if (error) return { deleted, errorMessage: error.message };
    const n = data?.length ?? 0;
    deleted += n;
    if (slice.length > 0 && n === 0) {
      return { deleted, errorMessage: RLS_HINT };
    }
  }
  return { deleted, errorMessage: null };
}

async function deleteOneRow(
  table: PauseAdminDeleteTable,
  id: string,
): Promise<{ ok: boolean; errorMessage: string | null }> {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) return { ok: false, errorMessage: error.message };
  if (!data?.length) return { ok: false, errorMessage: RLS_HINT };
  return { ok: true, errorMessage: null };
}

/** Admin: delete one companion cache row (RLS must allow admin). */
export async function deleteCompanionCacheRow(
  id: string,
): Promise<{ ok: boolean; errorMessage: string | null }> {
  return deleteOneRow('companion_cache', id);
}

/** Admin: bulk-delete companion cache rows in chunks. */
export async function deleteCompanionCacheRowsByIds(
  ids: string[],
  chunkSize: number,
): Promise<{ deleted: number; errorMessage: string | null }> {
  return deleteRowsByIds('companion_cache', ids, chunkSize);
}

/** Admin: bulk-delete generation_attempts rows in chunks. */
export async function deleteGenerationAttemptRowsByIds(
  ids: string[],
  chunkSize: number,
): Promise<{ deleted: number; errorMessage: string | null }> {
  return deleteRowsByIds('generation_attempts', ids, chunkSize);
}
