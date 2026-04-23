import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import {
  AutoCooldownIndicator,
  SNAPSHOT_STORAGE_KEY,
  computeNextScanAt,
  readPersistedSnapshot,
} from '@/components/home/HomePauseChrome';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('HomePauseChrome scheduling helpers', () => {
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

  it('uses the next cron tick while idle', () => {
    const now = Date.now();
    const result = computeNextScanAt(now, 0, 120_000);
    expect(result).toBe(now + 120_000);
  });

  it('rounds cooldown end up to the next cron grid slot', () => {
    const now = Date.now();
    const result = computeNextScanAt(now, 90_000, 60_000);
    // nextCronAt is +1m, cooldown ends at +1m30s, so the next actionable
    // check is the following 15-minute slot (+16m from now).
    expect(result).toBe(now + 960_000);
  });

  it('hydrates only non-stale persisted snapshots', () => {
    const now = Date.now();
    localStorage.setItem(
      SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        remaining: 45_000,
        readyAt: now + 45_000,
        nextScanAt: now + 60_000,
      }),
    );
    expect(readPersistedSnapshot()).toEqual({
      remaining: 45_000,
      readyAt: now + 45_000,
      nextScanAt: now + 60_000,
    });

    localStorage.setItem(
      SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        remaining: 0,
        readyAt: now - 60_000,
        nextScanAt: now - 1,
      }),
    );
    expect(readPersistedSnapshot()).toBeNull();
  });
});

describe('AutoCooldownIndicator cross-tab sync', () => {
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

  it('switches to cooldown copy when a sibling tab writes a fresh snapshot', () => {
    render(
      <AutoCooldownIndicator
        cooldownRemaining={() => 0}
        cooldownHours={2}
        nextCronCheckIn={() => 60_000}
      />,
    );

    expect(screen.getByText('home.nextScanAtClock')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SNAPSHOT_STORAGE_KEY,
          newValue: JSON.stringify({
            remaining: 30_000,
            readyAt: Date.now() + 30_000,
            nextScanAt: Date.now() + 60_000,
          }),
        }),
      );
    });

    expect(screen.getByText('home.cooldownReadyAt')).toBeInTheDocument();
    expect(screen.queryByText('home.nextScanAtClock')).not.toBeInTheDocument();
  });
});
