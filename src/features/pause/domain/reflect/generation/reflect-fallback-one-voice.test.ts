import { describe, expect, it } from 'vitest';
import { buildReflectClientFallback } from './build-reflect-client-fallback';
import { composeReflectFallbackOneVoice } from './reflection-content-v2';
import { formatReflectIntegratedProse } from './format-reflect-integrated-prose';
import { resolvePauseReflectDisplayContent } from './resolve-pause-reflect-display-content';

const t = ((_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key) as import('i18next').TFunction;

describe('reflect fallback one voice', () => {
  it('composeReflectFallbackOneVoice joins land and inquiry in one paragraph', () => {
    const prose = composeReflectFallbackOneVoice(
      'This moment can feel loud.',
      'What feels most at risk',
    );
    expect(prose).toBe('This moment can feel loud. What feels most at risk?');
    expect(prose).not.toContain('\n\n');
  });

  it('client fallback renders as a single editorial block (no context strip paragraph)', () => {
    const content = buildReflectClientFallback({
      context: 'BTC is down 8%',
      severityAbsPct: 8,
      currentFeel: { mood: 'anxious' },
    });
    expect(content.contextStrip).toBeNull();
    const prose = formatReflectIntegratedProse(content);
    expect(prose).not.toContain('\n\n');
    expect(prose).toContain('?');
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
    expect(display?.message).not.toContain('\n\n');
  });
});
