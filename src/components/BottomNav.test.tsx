import { describe, it, expect } from 'vitest';
import { isPrimaryTabActive } from './BottomNav';

describe('isPrimaryTabActive', () => {
  it('matches home and library', () => {
    expect(isPrimaryTabActive('/', 'home')).toBe(true);
    expect(isPrimaryTabActive('/library', 'home')).toBe(false);
    expect(isPrimaryTabActive('/library', 'library')).toBe(true);
  });

  it('matches tools hub only (not immersive /tools/*)', () => {
    expect(isPrimaryTabActive('/tools', 'tools')).toBe(true);
    expect(isPrimaryTabActive('/tools/breathe', 'tools')).toBe(false);
  });

  it('matches journey prefix and settings subtree', () => {
    expect(isPrimaryTabActive('/journey/stats', 'journey')).toBe(true);
    expect(isPrimaryTabActive('/settings', 'settings')).toBe(true);
    expect(isPrimaryTabActive('/settings/about', 'settings')).toBe(true);
  });
});
