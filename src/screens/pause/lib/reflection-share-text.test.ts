import { describe, expect, it } from 'vitest';
import { buildReflectionShareText } from '@/screens/pause/lib/reflection-share-text';

describe('buildReflectionShareText', () => {
  it('appends Holzen attribution and site host', () => {
    const text = buildReflectionShareText('Stayed calm.');
    expect(text).toContain('Stayed calm.');
    expect(text).toContain('— Holzen');
    expect(text).toMatch(/\n\n— Holzen\n/);
  });
});
