import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadPauseSessionSnapshot } from '@/features/pause/infrastructure/queries/companion-session-snapshot-query';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

function chainMaybeSingle(data: unknown, error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data, error }),
      }),
    }),
  };
}

function chainArtifacts(rows: unknown[]) {
  return {
    select: () => ({
      eq: async () => ({ data: rows }),
    }),
  };
}

describe('loadPauseSessionSnapshot', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns snapshot with empty reflection when instance exists but reflect step has not run', async () => {
    fromMock
      .mockReturnValueOnce(
        chainMaybeSingle({
          id: 'pause-1',
          context_snapshot: { context_text: 'BTC moved', last_reported_mood: 'anxious' },
        }),
      )
      .mockReturnValueOnce(chainArtifacts([]));

    const out = await loadPauseSessionSnapshot('pause-1');
    expect(out).toEqual({
      id: 'pause-1',
      reflectionMessage: '',
      context: 'BTC moved',
      mood: 'anxious',
      companions: { haiku: null, groundingTitle: null, groundingBody: null },
    });
  });

  it('returns null when pause instance row is missing', async () => {
    fromMock.mockReturnValueOnce(chainMaybeSingle(null, { message: 'not found' }));
    await expect(loadPauseSessionSnapshot('missing')).resolves.toBeNull();
  });
});
