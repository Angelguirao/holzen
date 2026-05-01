import { useCallback, useEffect, useState } from 'react';
import type { ToolCatalogId } from '@/lib/tools-catalog';
import { TOOLS_HUB_MORE_ORDER, TOOLS_HUB_SPOTLIGHT_ORDER } from '@/lib/tools-catalog';

const STORAGE_PREFIX = 'holzen_tools_favorite_ids';

const ALL_IDS: ToolCatalogId[] = [...TOOLS_HUB_SPOTLIGHT_ORDER, ...TOOLS_HUB_MORE_ORDER];

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function load(userId: string | undefined): ToolCatalogId[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const next: ToolCatalogId[] = [];
    for (const id of parsed) {
      if (ALL_IDS.includes(id as ToolCatalogId)) next.push(id as ToolCatalogId);
    }
    return next.slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * User-curated “your activities” chips on the Tools hub (per-device, localStorage).
 */
export function useToolsFavoriteActivities(userId: string | undefined) {
  const [favoriteIds, setFavoriteIdsState] = useState<ToolCatalogId[]>(() => load(userId));

  useEffect(() => {
    setFavoriteIdsState(load(userId));
  }, [userId]);

  const setFavoriteIds = useCallback(
    (next: ToolCatalogId[]) => {
      if (!userId) return;
      const cleaned = next.filter((id) => ALL_IDS.includes(id)).slice(0, 8);
      localStorage.setItem(storageKey(userId), JSON.stringify(cleaned));
      setFavoriteIdsState(cleaned);
    },
    [userId],
  );

  return { favoriteIds, setFavoriteIds, allSelectableIds: ALL_IDS };
}
