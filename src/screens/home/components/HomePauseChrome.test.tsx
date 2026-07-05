import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { PauseCronScheduleIndicator } from '@/screens/home/components/HomePauseChrome';

const SNAPSHOT_STORAGE_KEY = 'holzen_home_cron_schedule_snapshot_v1';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PauseCronScheduleIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T10:00:00.000Z'));
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('persists the next cron scan timestamp while idle', () => {
    const now = Date.now();
    render(<PauseCronScheduleIndicator nextCronCheckIn={() => 120_000} />);

    const row = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || 'null');
    expect(row).toEqual({ nextScanAt: now + 120_000 });
    expect(screen.getByText('home.autoCooldown.nextScanAtClock')).toBeInTheDocument();
  });

  it('ignores stale persisted snapshots and recomputes a fresh idle snapshot', () => {
    const now = Date.now();
    localStorage.setItem(
      SNAPSHOT_STORAGE_KEY,
      JSON.stringify({ nextScanAt: now - 1 }),
    );

    render(<PauseCronScheduleIndicator nextCronCheckIn={() => 60_000} />);

    expect(screen.getByText('home.autoCooldown.nextScanAtClock')).toBeInTheDocument();
  });
});

describe('PauseCronScheduleIndicator cross-tab sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mirrors a sibling tab snapshot', () => {
    render(<PauseCronScheduleIndicator nextCronCheckIn={() => 60_000} />);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SNAPSHOT_STORAGE_KEY,
          newValue: JSON.stringify({
            nextScanAt: Date.now() + 90_000,
          }),
        }),
      );
    });

    expect(screen.getByText('home.autoCooldown.nextScanAtClock')).toBeInTheDocument();
  });
});
