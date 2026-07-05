import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileSessionInvalidError } from '@/features/user/domain/profile-session-invalid-error';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: fromMock },
}));

import { fetchProfileRowForUser } from './profile-row-query';

function chainMaybeSingle(data: unknown, error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data, error }),
      }),
    }),
  };
}

describe('fetchProfileRowForUser', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns an existing profile row', async () => {
    const row = { user_id: 'user-1', has_onboarded: true };
    fromMock.mockReturnValue(chainMaybeSingle(row));

    await expect(fetchProfileRowForUser('user-1')).resolves.toEqual(row);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it('throws ProfileSessionInvalidError when insert violates auth.users FK', async () => {
    fromMock
      .mockReturnValueOnce(chainMaybeSingle(null))
      .mockReturnValueOnce({
        insert: async () => ({
          error: { code: '23503', message: 'Key is not present in table "users".' },
        }),
      });

    await expect(fetchProfileRowForUser('ghost-user')).rejects.toBeInstanceOf(
      ProfileSessionInvalidError,
    );
  });

  it('throws ProfileSessionInvalidError when profile row is still missing after insert', async () => {
    fromMock
      .mockReturnValueOnce(chainMaybeSingle(null))
      .mockReturnValueOnce({
        insert: async () => ({ error: null }),
      })
      .mockReturnValueOnce(chainMaybeSingle(null));

    await expect(fetchProfileRowForUser('user-1')).rejects.toBeInstanceOf(
      ProfileSessionInvalidError,
    );
  });
});
