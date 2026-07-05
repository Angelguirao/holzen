import { describe, expect, it } from 'vitest';
import { buildReflectClientFallback } from './build-reflect-client-fallback';

describe('buildReflectClientFallback', () => {
  it('returns v2 shape with one-voice message and no context strip', () => {
    const content = buildReflectClientFallback({
      context: 'BTC is down 8% over 24h',
      severityAbsPct: 8,
      currentFeel: { mood: 'fearful', intensity: 4, tileLabel: 'Worried' },
    });

    expect(content.schemaVersion).toBe(2);
    expect(content.land.length).toBeGreaterThan(10);
    expect(content.hypothesis.length).toBeGreaterThan(10);
    expect(content.inquiry).toContain('?');
    expect(content.contextStrip).toBeNull();
    expect(content.message).toContain(content.land);
    expect(content.message).toContain(content.inquiry);
    expect(content.message).not.toContain('\n\n');
  });

  it('uses mood-specific inquiry for down markets', () => {
    const fearful = buildReflectClientFallback({
      context: 'BTC is down 3%',
      severityAbsPct: 3,
      currentFeel: { mood: 'fearful' },
    });
    const calm = buildReflectClientFallback({
      context: 'BTC is down 3%',
      severityAbsPct: 3,
      currentFeel: { mood: 'calm' },
    });

    expect(fearful.inquiry).not.toBe(calm.inquiry);
  });
});
