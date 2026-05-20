import { supabase } from '@/integrations/supabase/client';

export type SignalSourceAdminMutationResult = {
  ok: boolean;
  errorMessage: string | null;
};

function resultFromError(error: { message: string } | null): SignalSourceAdminMutationResult {
  return { ok: !error, errorMessage: error?.message ?? null };
}

/** Admin: add a row to the live-generation source catalog. */
export async function insertAdminSignalSource(params: {
  name: string;
  url: string | null;
  type: string;
  category: string;
  demoted_for_live?: boolean;
}): Promise<SignalSourceAdminMutationResult> {
  const { error } = await supabase.from('signal_sources').insert({
    name: params.name,
    url: params.url,
    type: params.type,
    category: params.category,
    demoted_for_live: params.demoted_for_live ?? false,
  });
  return resultFromError(error);
}

/** Admin: exclude or restore a catalog source from live web search. */
export async function setSignalSourceDemotedForLive(
  id: string,
  demoted: boolean,
): Promise<SignalSourceAdminMutationResult> {
  const { error } = await supabase
    .from('signal_sources')
    .update({ demoted_for_live: demoted })
    .eq('id', id);
  return resultFromError(error);
}

export type ApproveSignalSourceSuggestionInput = {
  suggestionId: string;
  suggested_name: string;
  suggested_url: string | null;
  suggested_type: string | null;
  category: string;
};

export type ApproveSignalSourceSuggestionResult =
  | { ok: true }
  | { ok: false; errorMessage: string; failedStep: 'insert' | 'update' };

/** Admin: approve a queued suggestion → catalog insert + suggestion status. */
export async function approveSignalSourceSuggestion(
  input: ApproveSignalSourceSuggestionInput,
): Promise<ApproveSignalSourceSuggestionResult> {
  const insertResult = await insertAdminSignalSource({
    name: input.suggested_name.trim(),
    url: input.suggested_url?.trim() || null,
    type: input.suggested_type || 'blog',
    category: input.category,
    demoted_for_live: false,
  });
  if (!insertResult.ok) {
    return {
      ok: false,
      errorMessage: insertResult.errorMessage ?? 'Unknown error',
      failedStep: 'insert',
    };
  }

  const { error } = await supabase
    .from('signal_source_suggestions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', input.suggestionId);
  if (error) {
    return { ok: false, errorMessage: error.message, failedStep: 'update' };
  }
  return { ok: true };
}

/** Admin: reject a queued source suggestion. */
export async function rejectSignalSourceSuggestion(
  suggestionId: string,
): Promise<SignalSourceAdminMutationResult> {
  const { error } = await supabase
    .from('signal_source_suggestions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', suggestionId);
  return resultFromError(error);
}

const DELETE_RLS_HINT =
  'No rows were deleted. Apply pending Supabase migrations for admin policies on this table, and ensure profiles.is_admin is true for your user.';

/** Admin: delete one signal_sources catalog row. */
export async function deleteSignalSourceRow(
  id: string,
): Promise<SignalSourceAdminMutationResult> {
  const { data, error } = await supabase.from('signal_sources').delete().eq('id', id).select('id');
  if (error) return resultFromError(error);
  if (!data?.length) return { ok: false, errorMessage: DELETE_RLS_HINT };
  return { ok: true, errorMessage: null };
}

/** Admin: bulk-delete signal_sources rows in chunks. */
export async function deleteSignalSourceRowsByIds(
  ids: string[],
  chunkSize: number,
): Promise<{ deleted: number; errorMessage: string | null }> {
  let deleted = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('signal_sources')
      .delete()
      .in('id', slice)
      .select('id');
    if (error) return { deleted, errorMessage: error.message };
    const n = data?.length ?? 0;
    deleted += n;
    if (slice.length > 0 && n === 0) {
      return { deleted, errorMessage: DELETE_RLS_HINT };
    }
  }
  return { deleted, errorMessage: null };
}
