import { describe, expect, it } from 'vitest';
import { extractSignalSourceHost, resolveSignalSourceTrustedBadge } from './signal-source-trusted';

describe('extractSignalSourceHost', () => {
  it('normalizes host without www', () => {
    expect(extractSignalSourceHost('https://www.Example.com/path')).toBe('example.com');
  });

  it('returns null for invalid url', () => {
    expect(extractSignalSourceHost('not-a-url')).toBeNull();
  });
});

describe('resolveSignalSourceTrustedBadge', () => {
  it('returns null while pending', () => {
    expect(
      resolveSignalSourceTrustedBadge('example.com', [], { pending: true, error: false }),
    ).toBeNull();
  });

  it('returns true when catalog contains matching host', () => {
    expect(
      resolveSignalSourceTrustedBadge(
        'reuters.com',
        [{ url: 'https://www.reuters.com/article' }],
        { pending: false, error: false },
      ),
    ).toBe(true);
  });

  it('returns false when catalog is empty', () => {
    expect(
      resolveSignalSourceTrustedBadge('reuters.com', [], { pending: false, error: false }),
    ).toBe(false);
  });
});
