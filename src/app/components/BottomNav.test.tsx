import { describe, it, expect } from 'vitest';
import { isPrimaryTabActive } from './BottomNav';

describe('isPrimaryTabActive', () => {
  it('matches home and archive', () => {
    expect(isPrimaryTabActive('/', 'home')).toBe(true);
    expect(isPrimaryTabActive('/archive', 'home')).toBe(false);
    expect(isPrimaryTabActive('/archive', 'archive')).toBe(true);
    expect(isPrimaryTabActive('/archive/segment', 'archive')).toBe(true);
  });

  it('matches journey only on /journey (not legacy tab paths)', () => {
    expect(isPrimaryTabActive('/journey', 'journey')).toBe(true);
    expect(isPrimaryTabActive('/journey/stats', 'journey')).toBe(false);
    expect(isPrimaryTabActive('/journey/badges', 'journey')).toBe(false);
    expect(isPrimaryTabActive('/settings', 'journey')).toBe(false);
  });

  it('matches the settings tab on any /settings/* route', () => {
    expect(isPrimaryTabActive('/settings', 'settings')).toBe(true);
    expect(isPrimaryTabActive('/settings/account', 'settings')).toBe(true);
    expect(isPrimaryTabActive('/journey', 'settings')).toBe(false);
  });

  it('does not treat retired /tools paths as a primary tab', () => {
    expect(isPrimaryTabActive('/tools', 'home')).toBe(false);
    expect(isPrimaryTabActive('/tools/letters', 'archive')).toBe(false);
  });
});
