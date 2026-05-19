import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AutoCooldownIndicator } from '@/screens/home/components/HomePauseChrome';

const SNAPSHOT_STORAGE_KEY = 'holzen_home_cooldown_snapshot_v1';

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
    render(
      <AutoCooldownIndicator
        cooldownRemaining={() => 0}
        cooldownHours={2}
        nextCronCheckIn={() => 120_000}
      />,
    );

    const row = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || 'null');
    expect(row).toMatchObject({
      remaining: 0,
      readyAt: now,
      nextScanAt: now + 120_000,
    });
  });

  it('rounds cooldown end up to the next cron grid slot', () => {
    const now = Date.now();
    render(
      <AutoCooldownIndicator
        cooldownRemaining={() => 90_000}
        cooldownHours={2}
        nextCronCheckIn={() => 60_000}
      />,
    );

    // nextCronAt is +1m, cooldown ends at +1m30s, so the next actionable
    // check is the following 15-minute slot (+16m from now).
    const row = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || 'null');
    expect(row).toMatchObject({
      remaining: 90_000,
      readyAt: now + 90_000,
      nextScanAt: now + 960_000,
    });
  });

  it('ignores stale persisted snapshots and recomputes a fresh idle snapshot', () => {
    const now = Date.now();
    localStorage.setItem(
      SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        // stale: active target already passed
        remaining: 30_000,
        readyAt: now - 1,
        nextScanAt: now + 60_000,
      }),
    );

    render(
      <AutoCooldownIndicator
        cooldownRemaining={() => 0}
        cooldownHours={2}
        nextCronCheckIn={() => 60_000}
      />,
    );

    expect(screen.getByText('home.autoCooldown.nextScanAtClock')).toBeInTheDocument();
    expect(screen.queryByText('home.autoCooldown.cooldownReadyAt')).not.toBeInTheDocument();
  });
});

describe('AutoCooldownIndicator cross-tab sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
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

    expect(screen.getByText('home.autoCooldown.nextScanAtClock')).toBeInTheDocument();

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

    expect(screen.getByText('home.autoCooldown.cooldownReadyAt')).toBeInTheDocument();
    expect(screen.queryByText('home.autoCooldown.nextScanAtClock')).not.toBeInTheDocument();
  });
});
