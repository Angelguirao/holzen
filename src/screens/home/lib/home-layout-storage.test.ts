import { describe, expect, it, beforeEach } from 'vitest';
import {
  homeLayoutOrderStorageKey,
  homeOptionalVisibilityStorageKey,
  loadHomeLayoutOrder,
  loadHomeOptionalVisibility,
  migrateLegacyGlobalLayoutKey,
} from '@/screens/home/lib/home-layout-storage';
import { ALL_HOME_SECTION_IDS } from '@/screens/home/lib/home-section-visibility-constants';

const USER_A = 'user-a-111';
const USER_B = 'user-b-222';
const DEFAULT = [...ALL_HOME_SECTION_IDS];

describe('home layout storage (per user)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scopes order separately per user', () => {
    const orderA = ['goal-why', 'market', 'your-pause', 'journey-pulse'];
    localStorage.setItem(homeLayoutOrderStorageKey(USER_A), JSON.stringify(orderA));

    expect(loadHomeLayoutOrder(USER_A, DEFAULT)).toEqual(orderA);
    expect(loadHomeLayoutOrder(USER_B, DEFAULT)).toEqual(DEFAULT);
  });

  it('migrates legacy global order into the first signed-in user only', () => {
    const legacyOrder = ['goal-why', 'your-pause', 'market', 'journey-pulse'];
    localStorage.setItem('holzen_home_section_order_v1', JSON.stringify(legacyOrder));

    expect(loadHomeLayoutOrder(USER_A, DEFAULT)).toEqual(legacyOrder);
    expect(localStorage.getItem('holzen_home_section_order_v1')).toBeNull();
    expect(localStorage.getItem(homeLayoutOrderStorageKey(USER_A))).toBe(JSON.stringify(legacyOrder));

    expect(loadHomeLayoutOrder(USER_B, DEFAULT)).toEqual(DEFAULT);
  });

  it('migrateLegacyGlobalLayoutKey removes all listed legacy keys after copy', () => {
    localStorage.setItem('holzen_home_optional_visible', JSON.stringify({ 'journey-pulse': false }));

    migrateLegacyGlobalLayoutKey(homeOptionalVisibilityStorageKey(USER_A), ['holzen_home_optional_visible']);

    expect(localStorage.getItem('holzen_home_optional_visible')).toBeNull();
    expect(loadHomeOptionalVisibility(USER_A)['journey-pulse']).toBe(false);
  });
});
