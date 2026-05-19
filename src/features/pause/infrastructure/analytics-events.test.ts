import { describe, expect, it, vi, beforeEach } from 'vitest';

const insert = vi.fn(async () => ({ error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ insert }),
  },
}));

describe('logCompanionFullviewOpened', () => {
  beforeEach(() => {
    insert.mockClear();
  });

  it('inserts companion_fullview_opened row', async () => {
    const { logCompanionFullviewOpened } = await import('./analytics-events');
    await logCompanionFullviewOpened({
      userId: 'user-1',
      companion: 'history',
      pauseInstanceId: 'pause-2',
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        event: 'companion_fullview_opened',
        metadata: expect.objectContaining({
          companion: 'history',
          pause_instance_id: 'pause-2',
        }),
      }),
    );
  });
});
