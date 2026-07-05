import { describe, expect, it } from 'vitest';
import { buildReflectClientFallback } from './build-reflect-client-fallback';
import { composeReflectFallbackOneVoice } from './reflection-content-v2';
import { formatReflectIntegratedProse } from './format-reflect-integrated-prose';
import { resolvePauseReflectDisplayContent } from './resolve-pause-reflect-display-content';

const t = ((_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key) as import('i18next').TFunction;

describe('reflect fallback one voice', () => {
  it('composeReflectFallbackOneVoice weaves land, hypothesis, and inquiry', () => {
    const prose = composeReflectFallbackOneVoice(
      'The move can feel personal.',
      'Sometimes the story is older than the chart.',
      'What feels most at risk',
    );
    expect(prose).toContain('personal.');
    expect(prose).toContain('older than the chart.');
    expect(prose).toContain('most at risk?');
    expect(prose).not.toContain('\n\n');
  });

  it('client fallback includes hypothesis and one editorial block', () => {
    const content = buildReflectClientFallback({
      context: 'BTC is down 8%',
      severityAbsPct: 8,
      currentFeel: { mood: 'fearful', intensity: 4, tileLabel: 'Worried' },
    });

    expect(content.hypothesis.length).toBeGreaterThan(10);
    expect(content.contextStrip).toBeNull();
    const prose = formatReflectIntegratedProse(content);
    expect(prose).not.toContain('\n\n');
    expect(prose).toContain('?');
    expect(prose).toContain(content.hypothesis);
  });

  it('generation error prefers client fallback over stale structured content', () => {
    const stale = {
      schemaVersion: 2 as const,
      land: 'Stale land.',
      hypothesis: 'Stale hyp.',
      inquiry: 'Stale question?',
      contextStrip: 'Stale strip.',
      message: 'Stale land.\n\nStale hyp.\n\nStale question?',
    };
    const display = resolvePauseReflectDisplayContent({
      reflectionContent: stale,
      reflectionMessage: '',
      reflectionError: 'Network error',
      context: 'BTC is down 5%',
      severityAbsPct: 5,
      t,
    });
    expect(display?.message).not.toContain('Stale land');
    expect(display?.hypothesis.length).toBeGreaterThan(10);
  });
});
