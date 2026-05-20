import { describe, expect, it } from 'vitest';
import {
  breathCompletedSegment1Payload,
  breathCompletedSegment2Payload,
} from './breath-completed-payload';

describe('breathCompletedSegment1Payload', () => {
  it('defaults to deep first segment', () => {
    expect(breathCompletedSegment1Payload()).toEqual({ breath_segment: 1 });
  });

  it('adds brief_ritual for brief path', () => {
    expect(breathCompletedSegment1Payload({ briefRitual: true })).toEqual({
      breath_segment: 1,
      brief_ritual: true,
    });
  });

  it('supports skip variants', () => {
    expect(breathCompletedSegment1Payload({ skipped: true })).toEqual({
      breath_segment: 1,
      skipped: true,
    });
    expect(breathCompletedSegment1Payload({ skipped: true, briefRitual: true })).toEqual({
      breath_segment: 1,
      brief_ritual: true,
      skipped: true,
    });
  });
});

describe('breathCompletedSegment2Payload', () => {
  it('defaults to completed second segment', () => {
    expect(breathCompletedSegment2Payload()).toEqual({ breath_segment: 2 });
  });

  it('supports skip', () => {
    expect(breathCompletedSegment2Payload({ skipped: true })).toEqual({
      breath_segment: 2,
      skipped: true,
    });
  });
});
