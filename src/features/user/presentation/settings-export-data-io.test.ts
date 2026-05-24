import { describe, expect, it, vi, beforeEach } from 'vitest';
import { exportDataAction } from './settings-export-data-io';

vi.mock('@/features/auth/public', () => ({
  getAuthUser: vi.fn(),
}));

vi.mock('@/features/pause/public-hooks', () => ({
  fetchSettingsDataExportBundle: vi.fn(),
}));

vi.mock('@/features/user/public-queries', () => ({
  fetchProfileRowForUser: vi.fn(),
}));

import { getAuthUser } from '@/features/auth/public';
import { fetchSettingsDataExportBundle } from '@/features/pause/public-hooks';
import { fetchProfileRowForUser } from '@/features/user/public-queries';

describe('exportDataAction', () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockReset();
    vi.mocked(fetchSettingsDataExportBundle).mockReset();
    vi.mocked(fetchProfileRowForUser).mockReset();
  });

  it('returns not_authenticated when signed out', async () => {
    vi.mocked(getAuthUser).mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.set('format', 'json');
    await expect(exportDataAction({}, formData)).resolves.toEqual({ error: 'not_authenticated' });
  });

  it('exports json and returns success metadata', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    vi.mocked(getAuthUser).mockResolvedValueOnce({ id: 'user-1' } as never);
    vi.mocked(fetchProfileRowForUser).mockResolvedValueOnce({ threshold: 5 } as never);
    vi.mocked(fetchSettingsDataExportBundle).mockResolvedValueOnce({
      pauses: [{ created_at: '2026-01-01' }],
      stepEvents: [],
      companionEvents: [],
      aiArtifacts: [],
    } as never);

    const formData = new FormData();
    formData.set('format', 'json');
    await expect(exportDataAction({}, formData)).resolves.toMatchObject({
      success: true,
      format: 'json',
      pauseCount: 1,
    });
  });
});
