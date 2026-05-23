import { describe, expect, it } from 'vitest';
import { buildSilentReflectionStubMessage } from './build-silent-reflection-stub-message';

describe('buildSilentReflectionStubMessage', () => {
  it('formats asset symbol into stub copy', () => {
    expect(buildSilentReflectionStubMessage('BTC')).toBe('BTC moved.');
    expect(buildSilentReflectionStubMessage('ETH')).toBe('ETH moved.');
  });
});
