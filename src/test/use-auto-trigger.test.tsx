import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import { useAuth } from '@/hooks/use-auth';
import { useAutoTrigger } from '@/hooks/use-auto-trigger';
import { supabase } from '@/integrations/supabase/client';

type RealtimePayload = {
  new?: { last_message?: string | null };
};

type RealtimeCallback = (payload: RealtimePayload) => void;

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useAutoTrigger', () => {
  const useAuthMock = vi.mocked(useAuth);
  const fromMock = vi.mocked(supabase.from);
  const channelMock = vi.mocked(supabase.channel);
  const removeChannelMock = vi.mocked(supabase.removeChannel);

  let currentUser: { id: string } | null;
  let realtimeCallback: RealtimeCallback | undefined;
  let resolveInitialProfile:
    | ((value: { data: { last_message: string | null } }) => void)
    | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'user-1' };
    realtimeCallback = undefined;
    resolveInitialProfile = undefined;

    useAuthMock.mockImplementation(() => ({
      user: currentUser,
    }));

    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        new Promise<{ data: { last_message: string | null } }>((resolve) => {
          resolveInitialProfile = resolve;
        }),
      ),
    });

    channelMock.mockImplementation(() => {
      const channel = {
        on: vi.fn((_event, _filter, callback: RealtimeCallback) => {
          realtimeCallback = callback;
          return channel;
        }),
        subscribe: vi.fn(() => channel),
      };
      return channel;
    });
  });

  it('does not resubscribe when user object changes but user.id is stable', async () => {
    const { rerender, unmount } = renderHook(() => useAutoTrigger());
    expect(channelMock).toHaveBeenCalledTimes(1);
    expect(channelMock).toHaveBeenCalledWith('auto-trigger-user-1');
    expect(removeChannelMock).not.toHaveBeenCalled();

    currentUser = { id: 'user-1' };
    rerender();

    await act(async () => {
      await flushMicrotasks();
    });

    expect(channelMock).toHaveBeenCalledTimes(1);
    expect(removeChannelMock).not.toHaveBeenCalled();

    unmount();
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it('resubscribes when user.id changes', async () => {
    const { rerender } = renderHook(() => useAutoTrigger());
    const firstChannel = channelMock.mock.results[0]?.value;

    currentUser = { id: 'user-2' };
    rerender();

    await act(async () => {
      await flushMicrotasks();
    });

    expect(channelMock).toHaveBeenCalledTimes(2);
    expect(channelMock).toHaveBeenNthCalledWith(2, 'auto-trigger-user-2');
    expect(removeChannelMock).toHaveBeenCalledWith(firstChannel);
  });

  it('only sets pauseReady after baseline is initialized and message changes', async () => {
    const { result } = renderHook(() => useAutoTrigger());
    expect(result.current.pauseReady).toBe(false);

    act(() => {
      realtimeCallback?.({ new: { last_message: 'incoming' } });
    });
    expect(result.current.pauseReady).toBe(false);

    act(() => {
      resolveInitialProfile?.({ data: { last_message: 'baseline' } });
    });
    await act(async () => {
      await flushMicrotasks();
    });

    act(() => {
      realtimeCallback?.({ new: { last_message: 'baseline' } });
    });
    expect(result.current.pauseReady).toBe(false);

    act(() => {
      realtimeCallback?.({ new: { last_message: 'fresh' } });
    });
    expect(result.current.pauseReady).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.pauseReady).toBe(false);
  });
});
