import { describe, expect, it } from 'vitest';
import { itemBelongsToEchoesTab, itemBelongsToPausesTab, librarySourceForSegment } from '@/lib/archive-segment';

describe('archive-segment', () => {
  it('classifies zoom_out and history_insight as echoes', () => {
    expect(itemBelongsToEchoesTab({ source_type: 'zoom_out' })).toBe(true);
    expect(itemBelongsToEchoesTab({ source_type: 'history_insight' })).toBe(true);
    expect(itemBelongsToPausesTab({ source_type: 'zoom_out' })).toBe(false);
  });

  it('normalizes legacy reflection to pauses tab', () => {
    expect(librarySourceForSegment({ source_type: 'reflection' })).toBe('pause');
    expect(itemBelongsToEchoesTab({ source_type: 'reflection' })).toBe(false);
  });

  it('classifies haiku as pauses tab', () => {
    expect(itemBelongsToPausesTab({ source_type: 'haiku' })).toBe(true);
    expect(itemBelongsToEchoesTab({ source_type: 'haiku' })).toBe(false);
  });
});
