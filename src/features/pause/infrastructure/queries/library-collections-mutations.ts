import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Collection, CollectionItem } from '@/features/pause/domain/library-bundle';

type CollectionsInsert = Database['public']['Tables']['collections']['Insert'];
type CollectionsUpdate = Database['public']['Tables']['collections']['Update'];

export async function insertLibraryCollection(
  userId: string,
  col: Partial<Collection>,
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .insert({ ...col, user_id: userId } as CollectionsInsert)
    .select()
    .single();
  if (error) return null;
  return data as unknown as Collection;
}

export async function updateLibraryCollection(
  id: string,
  updates: Partial<Collection>,
): Promise<void> {
  await supabase.from('collections').update(updates as CollectionsUpdate).eq('id', id);
}

export async function deleteLibraryCollection(id: string): Promise<void> {
  await supabase.from('collections').delete().eq('id', id);
}

export async function insertLibraryCollectionItem(params: {
  collectionId: string;
  pauseInstanceId: string;
  position: number;
}): Promise<CollectionItem | null> {
  const { data, error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: params.collectionId,
      pause_instance_id: params.pauseInstanceId,
      position: params.position,
    } as never)
    .select()
    .single();
  if (error) return null;
  return data as unknown as CollectionItem;
}

export async function removeLibraryCollectionItem(
  collectionId: string,
  pauseInstanceId: string,
): Promise<void> {
  await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('pause_instance_id', pauseInstanceId);
}
