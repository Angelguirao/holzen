import { describe, expect, it, vi, beforeEach } from 'vitest';

const limit = vi.fn(async () => ({ data: [], error: null }));
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ eq, order }));
const select = vi.fn(() => ({ eq }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select }) },
}));

import { fetchDevModeFromAnalytics, readLocalDevMode } from './dev-mode-admin-query';

describe('dev-mode-admin-query', () => {
  beforeEach(() => {
    select.mockClear();
    eq.mockClear();
    localStorage.clear();
  });

  it('readLocalDevMode reads holzen_dev_mode flag', () => {
    localStorage.setItem('holzen_dev_mode', 'true');
    expect(readLocalDevMode()).toBe(true);
  });

  it('fetchDevModeFromAnalytics falls back to local when no rows', async () => {
    localStorage.setItem('holzen_dev_mode', 'true');
    const value = await fetchDevModeFromAnalytics('user-1');
    expect(value).toBe(true);
    expect(eq).toHaveBeenCalledWith('event', 'dev_mode_setting');
  });
});
