import { describe, expect, it, vi, beforeEach } from 'vitest';

const insertEvent = vi.fn(async () => ({ ok: true }));

vi.mock('@/features/pause/infrastructure/supabase-pause-analytics-repository', () => ({
  supabasePauseAnalyticsRepository: { insertEvent },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ insert: vi.fn() }) },
}));

describe('logDevModeSetting', () => {
  beforeEach(() => {
    insertEvent.mockClear();
  });

  it('routes dev_mode_setting through PauseAnalyticsRepository', async () => {
    const { logDevModeSetting } = await import('./dev-mode-analytics');
    await logDevModeSetting('user-1', true);
    expect(insertEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      event: 'dev_mode_setting',
      metadata: { enabled: true },
    });
  });
});
