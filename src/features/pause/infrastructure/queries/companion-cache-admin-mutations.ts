import { supabase } from '@/integrations/supabase/client';

export type CompanionCacheAdminMutationResult = {
  ok: boolean;
  errorMessage: string | null;
};

const DEMOTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Admin: quality 3, no expiry — preferred within pregen pool. */
export async function promoteCompanionCacheEntry(
  id: string,
): Promise<CompanionCacheAdminMutationResult> {
  const { error } = await supabase
    .from('companion_cache')
    .update({ quality_score: 3, expires_at: null })
    .eq('id', id);
  return { ok: !error, errorMessage: error?.message ?? null };
}

/** Admin: quality 1 with 7-day expiry. */
export async function demoteCompanionCacheEntry(
  id: string,
): Promise<CompanionCacheAdminMutationResult> {
  const expires = new Date(Date.now() + DEMOTE_TTL_MS).toISOString();
  const { error } = await supabase
    .from('companion_cache')
    .update({ quality_score: 1, expires_at: expires })
    .eq('id', id);
  return { ok: !error, errorMessage: error?.message ?? null };
}

/** Admin: deprioritize cache row for attribution without deleting body. */
export async function setCompanionCacheSourceUntrusted(
  id: string,
  untrusted: boolean,
): Promise<CompanionCacheAdminMutationResult> {
  const { error } = await supabase
    .from('companion_cache')
    .update({ source_untrusted: untrusted })
    .eq('id', id);
  return { ok: !error, errorMessage: error?.message ?? null };
}
