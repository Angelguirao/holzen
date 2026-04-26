import { describe, it, expect } from 'vitest';
import { isPrimaryTabActive } from './BottomNav';

describe('isPrimaryTabActive', () => {
  it('matches home and library', () => {
    expect(isPrimaryTabActive('/', 'home')).toBe(true);
    expect(isPrimaryTabActive('/library', 'home')).toBe(false);
    expect(isPrimaryTabActive('/library', 'library')).toBe(true);
    expect(isPrimaryTabActive('/library/abc', 'library')).toBe(true);
  });

  it('matches the new Practice and Calendar tabs', () => {
    expect(isPrimaryTabActive('/practice', 'practice')).toBe(true);
    expect(isPrimaryTabActive('/practice/anything', 'practice')).toBe(true);
    expect(isPrimaryTabActive('/calendar', 'calendar')).toBe(true);
    expect(isPrimaryTabActive('/', 'practice')).toBe(false);
  });

  it('matches journey prefix (Profile tab)', () => {
    expect(isPrimaryTabActive('/journey/stats', 'journey')).toBe(true);
    expect(isPrimaryTabActive('/journey/badges', 'journey')).toBe(true);
    expect(isPrimaryTabActive('/settings', 'journey')).toBe(false);
  });
});
