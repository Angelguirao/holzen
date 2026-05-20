import { describe, expect, it } from 'vitest';
import { reflectGenerationPrerequisite } from './generation-prerequisites';

describe('reflectGenerationPrerequisite', () => {
  it('returns idle when hook is disabled or ids missing', () => {
    expect(
      reflectGenerationPrerequisite({
        enabled: false,
        pauseInstanceId: 'p1',
        userId: 'u1',
        context: 'BTC down',
      }),
    ).toBe('idle');
    expect(
      reflectGenerationPrerequisite({
        enabled: true,
        pauseInstanceId: null,
        userId: 'u1',
        context: 'BTC down',
      }),
    ).toBe('idle');
  });

  it('returns missing_context when context is empty', () => {
    expect(
      reflectGenerationPrerequisite({
        enabled: true,
        pauseInstanceId: 'p1',
        userId: 'u1',
        context: '   ',
      }),
    ).toBe('missing_context');
  });

  it('returns ok when prerequisites are met', () => {
    expect(
      reflectGenerationPrerequisite({
        enabled: true,
        pauseInstanceId: 'p1',
        userId: 'u1',
        context: 'BTC is down 5%',
      }),
    ).toBe('ok');
  });
});
