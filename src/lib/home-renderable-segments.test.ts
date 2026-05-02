import { describe, expect, it } from 'vitest';
import { buildHomeRenderableSegments } from './home-renderable-segments';

describe('buildHomeRenderableSegments', () => {
  it('groups adjacent market + your-pause into one todayBlock', () => {
    expect(buildHomeRenderableSegments(['goal-why', 'market', 'your-pause', 'night'])).toEqual([
      { type: 'plain', id: 'goal-why' },
      { type: 'todayBlock', ids: ['market', 'your-pause'] },
      { type: 'plain', id: 'night' },
    ]);
  });

  it('does not group today sections when journey-pulse sits between them', () => {
    expect(buildHomeRenderableSegments(['market', 'journey-pulse', 'your-pause'])).toEqual([
      { type: 'plain', id: 'market' },
      { type: 'plain', id: 'journey-pulse' },
      { type: 'plain', id: 'your-pause' },
    ]);
  });

  it('keeps journey-pulse as plain when flanking today pair', () => {
    expect(
      buildHomeRenderableSegments(['night', 'market', 'your-pause', 'journey-pulse', 'quick-capture']),
    ).toEqual([
      { type: 'plain', id: 'night' },
      { type: 'todayBlock', ids: ['market', 'your-pause'] },
      { type: 'plain', id: 'journey-pulse' },
      { type: 'plain', id: 'quick-capture' },
    ]);
  });
});