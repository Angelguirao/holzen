import { describe, expect, it } from 'vitest';
import { resolvePauseArrivalToneAction } from './resolve-pause-arrival-tone-action';

describe('resolvePauseArrivalToneAction', () => {
  it('returns none when there is no arrival signal', () => {
    expect(resolvePauseArrivalToneAction(false, 'id-1', null)).toBe('none');
    expect(resolvePauseArrivalToneAction(true, null, null)).toBe('none');
  });

  it('clears duplicate arrival for the same instance without replaying tone', () => {
    expect(resolvePauseArrivalToneAction(true, 'id-1', 'id-1')).toBe('clear-only');
  });

  it('plays tone for a new instance arrival', () => {
    expect(resolvePauseArrivalToneAction(true, 'id-2', 'id-1')).toBe('play');
  });
});
