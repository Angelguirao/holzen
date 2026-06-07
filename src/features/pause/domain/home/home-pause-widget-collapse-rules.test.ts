import { describe, expect, it } from 'vitest';
import { resolveHomePauseWidgetExpandedAfterModeChange } from '@/features/pause/domain/home/home-pause-widget-collapse-rules';

describe('resolveHomePauseWidgetExpandedAfterModeChange', () => {
  it('expands when leaving manual cooldown for idle A', () => {
    expect(
      resolveHomePauseWidgetExpandedAfterModeChange({
        previousMode: 'D_collapsed',
        nextMode: 'A_collapsed',
        newPauseArrival: false,
        currentExpanded: false,
        hasUserId: true,
      }),
    ).toBe(true);
  });

  it('collapses when open pause ends', () => {
    expect(
      resolveHomePauseWidgetExpandedAfterModeChange({
        previousMode: 'C',
        nextMode: 'A_collapsed',
        newPauseArrival: false,
        currentExpanded: true,
        hasUserId: true,
      }),
    ).toBe(false);
  });

  it('expands when cron delivers a new open pause', () => {
    expect(
      resolveHomePauseWidgetExpandedAfterModeChange({
        previousMode: 'A_collapsed',
        nextMode: 'B',
        newPauseArrival: true,
        currentExpanded: false,
        hasUserId: true,
      }),
    ).toBe(true);
  });
});
