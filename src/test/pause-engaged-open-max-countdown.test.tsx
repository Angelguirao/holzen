import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PauseEngagedOpenMaxCountdown } from '@/components/pause/PauseEngagedOpenMaxCountdown';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options: { remaining: string }) =>
      `${options.remaining} left in this ritual window`,
  }),
}));

describe('PauseEngagedOpenMaxCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T10:00:00.000Z'));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the 12-hour engaged window and updates on the configured tick', () => {
    render(
      <PauseEngagedOpenMaxCountdown
        engagedAtIso="2026-05-04T10:00:00.000Z"
        tickMs={60_000}
      />,
    );

    expect(screen.getByText('12h 0m left in this ritual window')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText('11h 59m left in this ritual window')).toBeInTheDocument();
  });
});
