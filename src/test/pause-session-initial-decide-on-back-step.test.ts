import { describe, expect, it } from 'vitest';
import { initialDecideOnBackStepFromPersisted } from '@/lib/pause-session-initial-decide-on-back-step';

describe('initialDecideOnBackStepFromPersisted', () => {
  it('returns choose when no session', () => {
    expect(initialDecideOnBackStepFromPersisted(null)).toBe('choose');
  });

  it('uses explicit decideOnBackStep when set', () => {
    expect(
      initialDecideOnBackStepFromPersisted({
        step: 'decide',
        decideOnBackStep: 'choose',
      }),
    ).toBe('choose');
  });

  it('infers breath2 when restored on decide without explicit field', () => {
    expect(
      initialDecideOnBackStepFromPersisted({
        step: 'decide',
      }),
    ).toBe('breath2');
  });

  it('defaults to choose on non-decide step', () => {
    expect(
      initialDecideOnBackStepFromPersisted({
        step: 'feel',
      }),
    ).toBe('choose');
  });
});
