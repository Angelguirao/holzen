import { describe, expect, it } from 'vitest';
import { resolveHomePauseWidgetExpandedAfterSurfaceChange } from '@/features/pause/domain/home/home-pause-widget-expand-preference';

describe('resolveHomePauseWidgetExpandedAfterSurfaceChange', () => {
  it('expands when leaving manual cooldown for idle', () => {
    expect(
      resolveHomePauseWidgetExpandedAfterSurfaceChange({
        previousSurface: 'manual_cooldown_collapsed',
        nextSurface: 'idle_collapsed',
        newPauseArrival: false,
        currentExpanded: false,
        hasUserId: true,
      }),
    ).toBe(true);
  });

  it('collapses when open pause ends', () => {
    expect(
      resolveHomePauseWidgetExpandedAfterSurfaceChange({
        previousSurface: 'open_engaged',
        nextSurface: 'idle_collapsed',
        newPauseArrival: false,
        currentExpanded: true,
        hasUserId: true,
      }),
    ).toBe(false);
  });

  it('expands when cron delivers a new open pause', () => {
    expect(
      resolveHomePauseWidgetExpandedAfterSurfaceChange({
        previousSurface: 'idle_collapsed',
        nextSurface: 'open_pre_reflect',
        newPauseArrival: true,
        currentExpanded: false,
        hasUserId: true,
      }),
    ).toBe(true);
  });
});
