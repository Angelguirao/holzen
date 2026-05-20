import { describe, expect, it } from 'vitest';
import {
  dedupeBiases,
  normalizeBiasTitle,
  type RelatedBiasesRow,
} from '@/features/pause/public';

function row(partial: Partial<RelatedBiasesRow> & { title?: string; id: string }): RelatedBiasesRow {
  return {
    pause_instance_id: partial.id,
    created_at: partial.created_at ?? null,
    content: partial.content ?? (partial.title ? { title: partial.title } : null),
  };
}

describe('normalizeBiasTitle', () => {
  it('lowercases and trims', () => {
    expect(normalizeBiasTitle('  Anchoring Bias  ')).toBe('anchoring bias');
  });

  it('strips trailing punctuation so "Anchoring bias." collapses with "anchoring bias"', () => {
    expect(normalizeBiasTitle('Anchoring bias.')).toBe(normalizeBiasTitle('anchoring bias'));
  });

  it('collapses internal whitespace', () => {
    expect(normalizeBiasTitle('Anchoring   bias')).toBe('anchoring bias');
  });
});

describe('dedupeBiases', () => {
  it('dedupes by normalized title, keeping the most recent occurrence', () => {
    const rows = [
      row({ id: 'r3', title: 'Anchoring bias' }),
      row({ id: 'r2', title: 'Endowment effect' }),
      row({ id: 'r1', title: 'Anchoring bias.' }), // same key → dropped (older)
    ];
    const out = dedupeBiases(rows, { currentPauseInstanceId: null, currentTitle: null, limit: 5 });
    expect(out.map((b) => b.pause_instance_id)).toEqual(['r3', 'r2']);
  });

  it('excludes the current card by title (not just by id) so repeats of the same bias today are hidden', () => {
    const rows = [
      row({ id: 'r-other', title: 'Anchoring bias' }),
      row({ id: 'r-different', title: 'Endowment effect' }),
    ];
    const out = dedupeBiases(rows, {
      currentPauseInstanceId: null,
      currentTitle: 'Anchoring bias.',
      limit: 5,
    });
    expect(out.map((b) => b.pause_instance_id)).toEqual(['r-different']);
  });

  it('excludes the current reflection id', () => {
    const rows = [
      row({ id: 'current', title: 'Anchoring bias' }),
      row({ id: 'r2', title: 'Endowment effect' }),
    ];
    const out = dedupeBiases(rows, {
      currentPauseInstanceId: 'current',
      currentTitle: null,
      limit: 5,
    });
    expect(out.map((b) => b.pause_instance_id)).toEqual(['r2']);
  });

  it('skips rows with missing or empty titles', () => {
    const rows = [
      row({ id: 'r1', content: null }),
      row({ id: 'r2', content: { title: '' } }),
      row({ id: 'r3', title: 'Recency bias' }),
    ];
    const out = dedupeBiases(rows, { currentPauseInstanceId: null, currentTitle: null, limit: 5 });
    expect(out.map((b) => b.pause_instance_id)).toEqual(['r3']);
  });

  it('respects the limit', () => {
    const rows = [
      row({ id: 'r1', title: 'A' }),
      row({ id: 'r2', title: 'B' }),
      row({ id: 'r3', title: 'C' }),
      row({ id: 'r4', title: 'D' }),
    ];
    const out = dedupeBiases(rows, { currentPauseInstanceId: null, currentTitle: null, limit: 2 });
    expect(out.map((b) => b.pause_instance_id)).toEqual(['r1', 'r2']);
  });
});
