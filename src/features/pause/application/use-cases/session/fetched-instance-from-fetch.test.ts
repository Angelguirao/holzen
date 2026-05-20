import { describe, it, expect } from 'vitest';
import { buildFetchedPauseInstanceFromFetch } from './fetched-instance-from-fetch';

describe('buildFetchedPauseInstanceFromFetch', () => {
  it('maps reflection, context snapshot, and companion artifact kinds', () => {
    const out = buildFetchedPauseInstanceFromFetch(
      'pid-1',
      { context_snapshot: { context_text: 'BTC quiet' } },
      [
        { kind: 'reflection_text', content: { message: 'Breathe first.' } },
        { kind: 'haiku', content: { haiku: 'line / line / line' } },
        { kind: 'ground_nudge', content: { title: 'G title', body: 'G body' } },
      ],
    );
    expect(out).toEqual({
      id: 'pid-1',
      reflection_message: 'Breathe first.',
      context: 'BTC quiet',
      haiku: 'line / line / line',
      grounding_title: 'G title',
      grounding_body: 'G body',
      db_state: null,
      engaged_at: null,
    });
  });

  it('handles missing snapshot and empty artifacts', () => {
    const out = buildFetchedPauseInstanceFromFetch('p2', { context_snapshot: null }, []);
    expect(out).toEqual({
      id: 'p2',
      reflection_message: '',
      context: null,
      haiku: null,
      grounding_title: null,
      grounding_body: null,
      db_state: null,
      engaged_at: null,
    });
  });

  it('ignores non-string context_text', () => {
    const out = buildFetchedPauseInstanceFromFetch(
      'p3',
      { context_snapshot: { context_text: 123 as unknown as string } },
      [],
    );
    expect(out.context).toBeNull();
  });

  it('passes through engaged_at from instance row', () => {
    const out = buildFetchedPauseInstanceFromFetch(
      'p4',
      {
        context_snapshot: null,
        state: 'engaged',
        engaged_at: '2026-04-23T12:00:00.000Z',
      },
      [],
    );
    expect(out.engaged_at).toBe('2026-04-23T12:00:00.000Z');
    expect(out.db_state).toBe('engaged');
  });
});
