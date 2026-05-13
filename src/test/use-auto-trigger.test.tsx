import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useAutoTrigger } from '@/hooks/use-auto-trigger';

const {
  authState,
  channelMock,
  eqMock,
  fromMock,
  profileState,
  realtimeState,
  removeChannelMock,
  rpcMock,
  selectMock,
  singleMock,
  subscribeMock,
} = vi.hoisted(() => {
  const authState = { user: null as { id: string } | null };
  const profileState = { lastMessage: null as string | null };
  const realtimeState = {
    callback: null as ((payload: { new: { last_message?: string | null } }) => void) | null,
    channel: { topic: 'auto-trigger-channel' },
  };

  const rpcMock = vi.fn();
  const singleMock = vi.fn(() =>
    Promise.resolve({ data: { last_message: profileState.lastMessage } }),
  );
  const eqMock = vi.fn(() => ({ single: singleMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));
  const subscribeMock = vi.fn(() => realtimeState.channel);
  const onMock = vi.fn((_event, _filter, callback) => {
    realtimeState.callback = callback;
    return { subscribe: subscribeMock };
  });
  const channelMock = vi.fn(() => ({ on: onMock }));
  const removeChannelMock = vi.fn();

  return {
    authState,
    channelMock,
    eqMock,
    fromMock,
    profileState,
    realtimeState,
    removeChannelMock,
    rpcMock,
    selectMock,
    singleMock,
    subscribeMock,
  };
});

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: authState.user,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
    rpc: rpcMock,
  },
}));

describe('useAutoTrigger', () => {
  beforeEach(() => {
    authState.user = null;
    profileState.lastMessage = null;
    realtimeState.callback = null;
    window.history.replaceState({}, '', '/');

    channelMock.mockClear();
    eqMock.mockClear();
    fromMock.mockClear();
    removeChannelMock.mockClear();
    rpcMock.mockClear();
    selectMock.mockClear();
    singleMock.mockClear();
    subscribeMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the banner from a push deep-link and removes only the pause query param', async () => {
    window.history.replaceState({}, '', '/library?pause=ready&tab=pauses');

    const { result } = renderHook(() => useAutoTrigger());

    await waitFor(() => expect(result.current.pauseReady).toBe(true));
    expect(window.location.pathname + window.location.search).toBe('/library?tab=pauses');
  });

  it('uses the initial profile message as a realtime baseline before showing a new pause', async () => {
    authState.user = { id: 'user-1' };
    profileState.lastMessage = 'baseline reflection';

    const { result } = renderHook(() => useAutoTrigger());

    await waitFor(() => expect(singleMock).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(selectMock).toHaveBeenCalledWith('last_message');
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(channelMock).toHaveBeenCalledWith('auto-trigger-user-1');

    act(() => {
      realtimeState.callback?.({ new: { last_message: 'baseline reflection' } });
    });
    expect(result.current.pauseReady).toBe(false);

    act(() => {
      realtimeState.callback?.({ new: { last_message: 'fresh reflection' } });
    });
    expect(result.current.pauseReady).toBe(true);
  });

  it('dismisses the reminder locally without ending the open pause', async () => {
    authState.user = { id: 'user-1' };

    const { result } = renderHook(() => useAutoTrigger());

    await waitFor(() => expect(singleMock).toHaveBeenCalledTimes(1));
    await act(async () => {});

    act(() => {
      realtimeState.callback?.({ new: { last_message: 'fresh reflection' } });
    });
    expect(result.current.pauseReady).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.pauseReady).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('keeps the realtime subscription stable when only the auth object reference changes', async () => {
    authState.user = { id: 'user-1' };

    const { rerender } = renderHook(() => useAutoTrigger());

    await waitFor(() => expect(channelMock).toHaveBeenCalledTimes(1));
    authState.user = { id: 'user-1' };
    rerender();

    expect(channelMock).toHaveBeenCalledTimes(1);
    expect(removeChannelMock).not.toHaveBeenCalled();
  });
});
