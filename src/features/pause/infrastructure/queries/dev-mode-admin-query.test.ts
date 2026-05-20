import { describe, expect, it, vi, beforeEach } from 'vitest';

const limit = vi.fn(async () => ({ data: [], error: null }));
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ eq, order }));
const select = vi.fn(() => ({ eq }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select }) },
}));

describe('dev-mode-admin-query', () => {
  beforeEach(() => {
    select.mockClear();
    eq.mockClear();
    localStorage.clear();
  });

  it('readLocalDevMode reads holzen_dev_mode flag', async () => {
    const { readLocalDevMode } = await import('./dev-mode-admin-query');
    localStorage.setItem('holzen_dev_mode', 'true');
    expect(readLocalDevMode()).toBe(true);
  });

  it('fetchDevModeFromAnalytics falls back to local when no rows', async () => {
    const { fetchDevModeFromAnalytics } = await import('./dev-mode-admin-query');
    localStorage.setItem('holzen_dev_mode', 'true');
    const value = await fetchDevModeFromAnalytics('user-1');
    expect(value).toBe(true);
    expect(eq).toHaveBeenCalledWith('event', 'dev_mode_setting');
  });
});
