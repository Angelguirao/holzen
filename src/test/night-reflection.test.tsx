import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';

type NightReflectionRow = {
  id: string;
  message: string;
  btc_change_percent: number;
  btc_direction: string;
  created_at: string;
};

const authState = {
  user: { id: 'user-1' },
};

function makeSelectBuilder(rows: NightReflectionRow[]) {
  const builder: {
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn().mockResolvedValue({ data: rows }),
  };
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  return builder;
}

function makeUpdateBuilder() {
  const builder: {
    eq: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
  };
  builder.eq
    .mockImplementationOnce(() => builder)
    .mockResolvedValueOnce({ data: null, error: null });
  return builder;
}

const mockState = {
  rows: [] as NightReflectionRow[],
  selectBuilder: makeSelectBuilder([]),
  updateBuilder: makeUpdateBuilder(),
  fromMock: vi.fn(),
  selectMock: vi.fn(),
  updateMock: vi.fn(),
};

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockState.fromMock(...args),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNightReflection } from '@/components/NightReflectionCard';

function dismissedKey(userId: string) {
  return `holzen_night_reflection_dismissed_${userId}`;
}

function seedRows(rows: NightReflectionRow[]) {
  mockState.rows = rows;
  mockState.selectBuilder = makeSelectBuilder(rows);
  mockState.updateBuilder = makeUpdateBuilder();
  mockState.selectMock = vi.fn().mockReturnValue(mockState.selectBuilder);
  mockState.updateMock = vi.fn().mockReturnValue(mockState.updateBuilder);
  mockState.fromMock = vi.fn().mockReturnValue({
    select: mockState.selectMock,
    update: mockState.updateMock,
  });
}

describe('useNightReflection', () => {
  beforeEach(() => {
    localStorage.clear();
    seedRows([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('skips locally dismissed reflections and picks the first visible one', async () => {
    seedRows([
      {
        id: 'dismissed-local',
        message: 'Older one',
        btc_change_percent: -2,
        btc_direction: 'down',
        created_at: '2026-04-24T09:00:00.000Z',
      },
      {
        id: 'visible-reflection',
        message: 'Show this one',
        btc_change_percent: 1.5,
        btc_direction: 'up',
        created_at: '2026-04-24T10:00:00.000Z',
      },
    ]);
    localStorage.setItem(dismissedKey(authState.user.id), JSON.stringify(['dismissed-local']));

    const { result } = renderHook(() => useNightReflection());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.reflection?.id).toBe('visible-reflection');
    expect(mockState.selectMock).toHaveBeenCalled();
    expect(mockState.selectBuilder.eq).toHaveBeenCalledWith('user_id', authState.user.id);
    expect(mockState.selectBuilder.eq).toHaveBeenCalledWith('dismissed', false);
  });

  it('falls back safely when local dismissed cache is malformed', async () => {
    seedRows([
      {
        id: 'reflection-1',
        message: 'Render despite malformed cache',
        btc_change_percent: 0.1,
        btc_direction: 'up',
        created_at: '2026-04-24T10:00:00.000Z',
      },
    ]);
    localStorage.setItem(dismissedKey(authState.user.id), '{"invalid"');

    const { result } = renderHook(() => useNightReflection());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.reflection?.id).toBe('reflection-1');
  });

  it('dismiss persists local id and marks pending rows dismissed server-side', async () => {
    seedRows([
      {
        id: 'reflection-9',
        message: 'Dismiss me',
        btc_change_percent: -4.2,
        btc_direction: 'down',
        created_at: '2026-04-24T10:00:00.000Z',
      },
    ]);

    const { result } = renderHook(() => useNightReflection());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
      expect(result.current.reflection?.id).toBe('reflection-9');
    });

    await act(async () => {
      await result.current.dismiss();
    });

    expect(result.current.reflection).toBeNull();
    expect(mockState.updateMock).toHaveBeenCalledWith({ dismissed: true });
    expect(mockState.updateBuilder.eq).toHaveBeenCalledWith('user_id', authState.user.id);
    expect(mockState.updateBuilder.eq).toHaveBeenCalledWith('dismissed', false);
    expect(localStorage.getItem(dismissedKey(authState.user.id))).toBe(JSON.stringify(['reflection-9']));
  });

  it('returns null when every fetched row is already locally dismissed', async () => {
    seedRows([
      {
        id: 'r-1',
        message: 'one',
        btc_change_percent: -1,
        btc_direction: 'down',
        created_at: '2026-04-24T09:00:00.000Z',
      },
      {
        id: 'r-2',
        message: 'two',
        btc_change_percent: 1,
        btc_direction: 'up',
        created_at: '2026-04-24T10:00:00.000Z',
      },
    ]);
    localStorage.setItem(dismissedKey(authState.user.id), JSON.stringify(['r-1', 'r-2']));

    const { result } = renderHook(() => useNightReflection());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.reflection).toBeNull();
  });
});
