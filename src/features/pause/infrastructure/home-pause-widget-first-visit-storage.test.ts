import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  homePauseWidgetFirstVisitStorageKey,
  markHomePauseWidgetFirstVisitHandled,
  shouldExpandHomePauseWidgetFirstVisit,
} from './home-pause-widget-first-visit-storage';

describe('homePauseWidgetFirstVisitStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses a per-user storage key', () => {
    expect(homePauseWidgetFirstVisitStorageKey('user-1')).toBe(
      'holzen_home_pause_widget_first_visit_v1_user-1',
    );
  });

  it('allows idle onboarding auto-expand until consumed', () => {
    expect(shouldExpandHomePauseWidgetFirstVisit('user-1')).toBe(true);
    markHomePauseWidgetFirstVisitHandled('user-1');
    expect(shouldExpandHomePauseWidgetFirstVisit('user-1')).toBe(false);
    expect(shouldExpandHomePauseWidgetFirstVisit('user-2')).toBe(true);
  });
});
