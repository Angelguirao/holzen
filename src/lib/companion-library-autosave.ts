import { supabase } from '@/integrations/supabase/client';

export interface CompanionLibraryBookmarkParams {
  title: string;
  body: string;
  sourceType: string;
  sourceUrl?: string;
}

/**
 * Upsert a companion-derived bookmark into `library_items` if none exists for this
 * pause + source_type. Uses `lifecycleDedup` so each key is attempted at most once
 * per hook mount lifecycle (same behavior as the former in-hook Set ref).
 *
 * Post Pause V2: keyed on `pause_instance_id`; the legacy `reflection_id`
 * column was dropped in the destructive cutover migration.
 */
export async function saveCompanionLibraryBookmarkOnce(
  pauseInstanceId: string | null | undefined,
  params: CompanionLibraryBookmarkParams,
  lifecycleDedup: Set<string>,
): Promise<void> {
  if (!pauseInstanceId) return;
  const dedupKey = `${pauseInstanceId}:${params.sourceType}`;
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
      // `pause_instance_id` column exists post-201300 migration but isn't
      // yet in the generated types.ts — cast to `never` to bypass inference.
      .eq('pause_instance_id' as never, pauseInstanceId)
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
        pause_instance_id: pauseInstanceId,
        tags: [],
      } as never,
      { onConflict: 'user_id,pause_instance_id,source_type', ignoreDuplicates: true },
    );
  } finally {
    // Keep dedupKey — do not retry within the same component lifecycle
  }
}
