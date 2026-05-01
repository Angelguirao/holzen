import { describe, it, expect } from 'vitest';
import { isPrimaryTabActive } from './BottomNav';

describe('isPrimaryTabActive', () => {
  it('matches home and library', () => {
    expect(isPrimaryTabActive('/', 'home')).toBe(true);
    expect(isPrimaryTabActive('/library', 'home')).toBe(false);
    expect(isPrimaryTabActive('/library', 'library')).toBe(true);
    expect(isPrimaryTabActive('/library/abc', 'library')).toBe(true);
    expect(isPrimaryTabActive('/archive', 'library')).toBe(true);
    expect(isPrimaryTabActive('/archive/segment', 'library')).toBe(true);
  });

  it('matches the tools tab on the hub and nested tools routes', () => {
    expect(isPrimaryTabActive('/tools', 'tools')).toBe(true);
    expect(isPrimaryTabActive('/tools/letters', 'tools')).toBe(true);
    expect(isPrimaryTabActive('/', 'tools')).toBe(false);
  });

  it('matches the journey tab on any /journey/* route', () => {
    expect(isPrimaryTabActive('/journey/stats', 'journey')).toBe(true);
    expect(isPrimaryTabActive('/journey/badges', 'journey')).toBe(true);
    expect(isPrimaryTabActive('/settings', 'journey')).toBe(false);
  });

  it('matches the settings tab on any /settings/* route', () => {
    expect(isPrimaryTabActive('/settings', 'settings')).toBe(true);
    expect(isPrimaryTabActive('/settings/account', 'settings')).toBe(true);
    expect(isPrimaryTabActive('/journey/stats', 'settings')).toBe(false);
  });
});
