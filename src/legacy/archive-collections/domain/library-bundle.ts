import type { Database } from '@/integrations/supabase/types';

/** Archive list views and collection members both expose `v_pause_full`-shaped rows. */
export type CollectionMemberPause = Database['public']['Views']['v_pause_full']['Row'];

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  pause_instance_id: string;
  position: number;
  added_at: string;
}

export type LibraryListSortMode = 'newest' | 'oldest' | 'alphabetical';

export type LibraryBundle = {
  collections: Collection[];
  collectionItems: CollectionItem[];
  items: CollectionMemberPause[];
  /** True when `v_pause_full` member fetch failed but collections + items loaded. */
  memberRowsLoadFailed: boolean;
};
