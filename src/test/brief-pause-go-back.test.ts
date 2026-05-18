import { describe, expect, it } from 'vitest';
import { computeBriefRitualGoBack } from '@/features/pause/application/brief-ritual/brief-pause-go-back';

describe('computeBriefRitualGoBack', () => {
  it('returns null on first step', () => {
    expect(computeBriefRitualGoBack('feel')).toBeNull();
  });

  it('moves breath to feel without clearing integrate flag', () => {
    expect(computeBriefRitualGoBack('breath')).toEqual({
      prev: 'feel',
      clearBriefIntegrateDone: false,
    });
  });

  it('moves integrate to breath and clears integrate flag', () => {
    expect(computeBriefRitualGoBack('integrate')).toEqual({
      prev: 'breath',
      clearBriefIntegrateDone: true,
    });
  });

  it('moves decide to integrate and clears integrate flag', () => {
    expect(computeBriefRitualGoBack('decide')).toEqual({
      prev: 'integrate',
      clearBriefIntegrateDone: true,
    });
  });
});
