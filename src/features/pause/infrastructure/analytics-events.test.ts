import { describe, expect, it, vi, beforeEach } from 'vitest';

const insert = vi.fn(async () => ({ error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ insert }),
  },
}));

describe('pause analytics_events inserts', () => {
  beforeEach(() => {
    insert.mockClear();
  });

  it('inserts dev_mode_setting row', async () => {
    const { logDevModeSetting } = await import('./analytics-events');
    await logDevModeSetting('user-1', true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        event: 'dev_mode_setting',
        metadata: { enabled: true },
      }),
    );
  });

});
