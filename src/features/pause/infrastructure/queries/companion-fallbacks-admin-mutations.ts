import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type CompanionFallbackAdminMutationResult = {
  ok: boolean;
  errorMessage: string | null;
};

function resultFromError(error: { message: string } | null): CompanionFallbackAdminMutationResult {
  return { ok: !error, errorMessage: error?.message ?? null };
}

/** Admin: update JSON payload for a hardcoded fallback row. */
export async function updateCompanionFallbackPayload(
  id: string,
  payload: Json,
): Promise<CompanionFallbackAdminMutationResult> {
  const { error } = await supabase
    .from('companion_fallbacks')
    .update({ payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  return resultFromError(error);
}

/** Admin: enable or disable a fallback row for generation. */
export async function setCompanionFallbackActive(
  id: string,
  isActive: boolean,
): Promise<CompanionFallbackAdminMutationResult> {
  const { error } = await supabase
    .from('companion_fallbacks')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);
  return resultFromError(error);
}

/** Admin: remove a fallback row from the pool. */
export async function deleteCompanionFallback(
  id: string,
): Promise<CompanionFallbackAdminMutationResult> {
  const { error } = await supabase.from('companion_fallbacks').delete().eq('id', id);
  return resultFromError(error);
}

/** Admin: swap `sort_order` between two rows in the same pool. */
export async function swapCompanionFallbackSortOrder(
  a: { id: string; sort_order: number },
  b: { id: string; sort_order: number },
): Promise<CompanionFallbackAdminMutationResult> {
  const { error: e1 } = await supabase
    .from('companion_fallbacks')
    .update({ sort_order: b.sort_order, updated_at: new Date().toISOString() })
    .eq('id', a.id);
  if (e1) return resultFromError(e1);
  const { error: e2 } = await supabase
    .from('companion_fallbacks')
    .update({ sort_order: a.sort_order, updated_at: new Date().toISOString() })
    .eq('id', b.id);
  return resultFromError(e2);
}

/** Admin: insert a new fallback row with empty template payload. */
export async function insertCompanionFallbackEntry(params: {
  pool_type: string;
  sort_order: number;
  payload: Json;
  is_active: boolean;
}): Promise<CompanionFallbackAdminMutationResult> {
  const { error } = await supabase.from('companion_fallbacks').insert(params);
  return resultFromError(error);
}
