import { mergeOrderWithDefaults, normalizeHomeSectionOrder } from '@/screens/home/lib/home-section-order-normalize';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from '@/screens/home/lib/home-section-visibility-constants';

const LEGACY_GLOBAL_ORDER_KEY = 'holzen_home_section_order_v1';
const LEGACY_WIDGET_ORDER_KEY = 'holzen_widget_order';
const LEGACY_GLOBAL_COLLAPSED_KEY = 'holzen_home_section_collapsed_v1';
const LEGACY_WIDGET_COLLAPSED_KEY = 'holzen_widget_collapsed';
const LEGACY_GLOBAL_VISIBILITY_KEY = 'holzen_home_optional_visible';

const VISIBILITY_KEYS = [JOURNEY_STAT_TILES_VISIBILITY_ID] as const;

export const defaultHomeOptionalVisibility: Record<string, boolean> = {
  [JOURNEY_STAT_TILES_VISIBILITY_ID]: true,
};

export function homeLayoutOrderStorageKey(userId: string): string {
  return `holzen_home_section_order_v2_${userId}`;
}

export function homeLayoutCollapsedStorageKey(userId: string): string {
  return `holzen_home_section_collapsed_v2_${userId}`;
}

export function homeOptionalVisibilityStorageKey(userId: string): string {
  return `holzen_home_optional_visible_v2_${userId}`;
}

function readStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    void 0;
  }
}

function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    void 0;
  }
}

/** Copy the first legacy global blob into the user-scoped key, then delete globals. */
export function migrateLegacyGlobalLayoutKey(scopedKey: string, legacyKeys: readonly string[]): string | null {
  if (readStorageItem(scopedKey)) return readStorageItem(scopedKey);
  for (const legacyKey of legacyKeys) {
    const raw = readStorageItem(legacyKey);
    if (!raw) continue;
    writeStorageItem(scopedKey, raw);
    for (const k of legacyKeys) removeStorageItem(k);
    return raw;
  }
  return null;
}

export function loadHomeLayoutOrder(userId: string | undefined, defaultOrder: readonly string[]): string[] {
  if (!userId) {
    return normalizeHomeSectionOrder([...defaultOrder], defaultOrder);
  }

  try {
    const scopedKey = homeLayoutOrderStorageKey(userId);
    const raw = migrateLegacyGlobalLayoutKey(scopedKey, [LEGACY_GLOBAL_ORDER_KEY, LEGACY_WIDGET_ORDER_KEY]);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return normalizeHomeSectionOrder(mergeOrderWithDefaults(parsed, defaultOrder), defaultOrder);
    }
  } catch {
    void 0;
  }

  return normalizeHomeSectionOrder([...defaultOrder], defaultOrder);
}

export function saveHomeLayoutOrder(userId: string | undefined, order: string[]): void {
  if (!userId) return;
  writeStorageItem(homeLayoutOrderStorageKey(userId), JSON.stringify(order));
}

export function loadHomeLayoutCollapsed(userId: string | undefined): Record<string, boolean> {
  if (!userId) return {};

  try {
    const scopedKey = homeLayoutCollapsedStorageKey(userId);
    const raw = migrateLegacyGlobalLayoutKey(scopedKey, [LEGACY_GLOBAL_COLLAPSED_KEY, LEGACY_WIDGET_COLLAPSED_KEY]);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    void 0;
  }

  return {};
}

export function saveHomeLayoutCollapsed(userId: string | undefined, collapsed: Record<string, boolean>): void {
  if (!userId) return;
  writeStorageItem(homeLayoutCollapsedStorageKey(userId), JSON.stringify(collapsed));
}

export function clearHomeLayoutCollapsed(userId: string | undefined): void {
  if (!userId) return;
  removeStorageItem(homeLayoutCollapsedStorageKey(userId));
}

export function loadHomeOptionalVisibility(userId: string | undefined): Record<string, boolean> {
  if (!userId) return { ...defaultHomeOptionalVisibility };

  try {
    const scopedKey = homeOptionalVisibilityStorageKey(userId);
    const raw = migrateLegacyGlobalLayoutKey(scopedKey, [LEGACY_GLOBAL_VISIBILITY_KEY]);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      const next = { ...defaultHomeOptionalVisibility };
      for (const id of VISIBILITY_KEYS) {
        if (typeof parsed[id] === 'boolean') next[id] = parsed[id];
      }
      return next;
    }
  } catch {
    void 0;
  }

  return { ...defaultHomeOptionalVisibility };
}

export function saveHomeOptionalVisibility(userId: string | undefined, visible: Record<string, boolean>): void {
  if (!userId) return;
  writeStorageItem(homeOptionalVisibilityStorageKey(userId), JSON.stringify(visible));
}

export function clearHomeOptionalVisibility(userId: string | undefined): void {
  if (!userId) return;
  removeStorageItem(homeOptionalVisibilityStorageKey(userId));
}

export function clearLegacyHomeLayoutGlobals(): void {
  for (const key of [
    LEGACY_GLOBAL_ORDER_KEY,
    LEGACY_WIDGET_ORDER_KEY,
    LEGACY_GLOBAL_COLLAPSED_KEY,
    LEGACY_WIDGET_COLLAPSED_KEY,
    LEGACY_GLOBAL_VISIBILITY_KEY,
  ]) {
    removeStorageItem(key);
  }
}
