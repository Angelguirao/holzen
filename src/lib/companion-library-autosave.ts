import { supabase } from '@/integrations/supabase/client';

export interface CompanionLibraryBookmarkParams {
  title: string;
  body: string;
  sourceType: string;
  sourceUrl?: string;
}

/**
 * Upsert a companion-derived bookmark into `library_items` if none exists for this
 * reflection + source_type. Uses `lifecycleDedup` so each key is attempted at most once
 * per hook mount lifecycle (same behavior as the former in-hook Set ref).
 */
export async function saveCompanionLibraryBookmarkOnce(
  reflectionId: string | null | undefined,
  params: CompanionLibraryBookmarkParams,
  lifecycleDedup: Set<string>,
): Promise<void> {
  if (!reflectionId) return;
  const dedupKey = `${reflectionId}:${params.sourceType}`;
  if (lifecycleDedup.has(dedupKey)) return;
  lifecycleDedup.add(dedupKey);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return;
    const { data: existing } = await supabase
      .from('library_items')
      .select('id')
      .eq('user_id', userId)
      .eq('reflection_id', reflectionId)
      .eq('source_type', params.sourceType)
      .limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from('library_items').upsert(
      {
        user_id: userId,
        type: 'bookmark',
        title: params.title,
        body: params.body,
        source_type: params.sourceType,
        source_url: params.sourceUrl || null,
        reflection_id: reflectionId,
        tags: [],
      },
      { onConflict: 'user_id,reflection_id,source_type', ignoreDuplicates: true },
    );
  } finally {
    // Keep dedupKey — do not retry within the same component lifecycle
  }
}
