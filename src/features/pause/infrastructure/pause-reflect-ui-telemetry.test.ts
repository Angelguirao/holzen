import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-ui-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('pause-reflect-ui-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks post-it open with has_pause_id', () => {
    trackPauseReflectPostItOpen('inst-1');
    expect(trackEvent).toHaveBeenCalledWith('pause_reflect_post_it_open', {
      surface: 'pause_reflect',
      has_pause_id: true,
    });
  });

  it('tracks share tap for pause_done surface', () => {
    trackPauseReflectShareTap('pause_done', null);
    expect(trackEvent).toHaveBeenCalledWith('pause_reflect_share_tap', {
      surface: 'pause_done',
      has_pause_id: false,
    });
  });

  it('tracks wallpaper tap', () => {
    trackPauseReflectWallpaperTap('pause_reflect');
    expect(trackEvent).toHaveBeenCalledWith('pause_reflect_wallpaper_tap', { surface: 'pause_reflect' });
  });
});
