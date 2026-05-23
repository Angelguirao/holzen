import { describe, it, expect } from 'vitest';
import { mapPersistedStep } from './map-persisted-step';

describe('mapPersistedStep', () => {
  it('maps legacy and empty keys to feel', () => {
    expect(mapPersistedStep(undefined)).toBe('feel');
    expect(mapPersistedStep('pause')).toBe('feel');
  });

  it('maps legacy ground/shift to reflect/frame', () => {
    expect(mapPersistedStep('ground')).toBe('reflect');
    expect(mapPersistedStep('shift')).toBe('frame');
  });

  it('passes through known PauseStep values', () => {
    expect(mapPersistedStep('decide')).toBe('decide');
    expect(mapPersistedStep('breath2')).toBe('breath2');
  });

  it('maps removed choose step to decide for storage resume', () => {
    expect(mapPersistedStep('choose')).toBe('decide');
  });
});
