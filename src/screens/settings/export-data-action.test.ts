import { describe, expect, it, vi, beforeEach } from 'vitest';
import { exportDataAction } from './export-data-action';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('@/features/pause/public-hooks', () => ({
  fetchSettingsDataExportBundle: vi.fn(),
}));

vi.mock('@/features/user/public-queries', () => ({
  fetchProfileRowForUser: vi.fn(),
}));

import { supabase } from '@/integrations/supabase/client';
import { fetchSettingsDataExportBundle } from '@/features/pause/public-hooks';
import { fetchProfileRowForUser } from '@/features/user/public-queries';

describe('exportDataAction', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getUser).mockReset();
    vi.mocked(fetchSettingsDataExportBundle).mockReset();
    vi.mocked(fetchProfileRowForUser).mockReset();
  });

  it('returns not_authenticated when signed out', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: null }, error: null });
    const formData = new FormData();
    formData.set('format', 'json');
    await expect(exportDataAction({}, formData)).resolves.toEqual({ error: 'not_authenticated' });
  });

  it('exports json and returns success metadata', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as never },
      error: null,
    });
    vi.mocked(fetchProfileRowForUser).mockResolvedValueOnce({ threshold: 5 } as never);
    vi.mocked(fetchSettingsDataExportBundle).mockResolvedValueOnce({
      pauses: [{ created_at: '2026-01-01' }],
      stepEvents: [],
      companionEvents: [],
      aiArtifacts: [],
    } as never);
    const formData = new FormData();
    formData.set('format', 'json');
    await expect(exportDataAction({}, formData)).resolves.toEqual({
      success: true,
      format: 'json',
      pauseCount: 1,
    });
  });

  it('returns export_failed when bundle fetch throws', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as never },
      error: null,
    });
    vi.mocked(fetchSettingsDataExportBundle).mockRejectedValueOnce(new Error('network'));
    const formData = new FormData();
    formData.set('format', 'csv');
    await expect(exportDataAction({}, formData)).resolves.toEqual({ error: 'export_failed' });
  });
});
