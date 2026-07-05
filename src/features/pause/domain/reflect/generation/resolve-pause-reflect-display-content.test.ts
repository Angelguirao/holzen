import { describe, expect, it } from 'vitest';
import { resolvePauseReflectDisplayContent } from './resolve-pause-reflect-display-content';

const t = ((_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key) as import('i18next').TFunction;

describe('resolvePauseReflectDisplayContent', () => {
  it('prefers client fallback over structured content when generation failed', () => {
    const stale = {
      schemaVersion: 2 as const,
      land: 'Old',
      hypothesis: 'Old hyp',
      inquiry: 'Old?',
      contextStrip: null,
      message: 'Old\n\nOld hyp\n\nOld?',
    };
    const fallback = resolvePauseReflectDisplayContent({
      reflectionContent: stale,
      reflectionMessage: '',
      reflectionError: 'fail',
      context: 'BTC is down',
      severityAbsPct: 5,
      t,
    });
    expect(fallback?.land).not.toBe('Old');
  });

  it('prefers structured reflectionContent when there is no error', () => {
    const structured = {
      schemaVersion: 2 as const,
      land: 'Land',
      hypothesis: 'Hyp',
      inquiry: 'Question?',
      contextStrip: null,
      message: 'Land\n\nHyp\n\nQuestion?',
    };
    expect(
      resolvePauseReflectDisplayContent({
        reflectionContent: structured,
        reflectionMessage: '',
        reflectionError: null,
        context: 'BTC is down',
        severityAbsPct: 5,
        t,
      }),
    ).toBe(structured);
  });

  it('builds client fallback when generation failed but context exists', () => {
    const content = resolvePauseReflectDisplayContent({
      reflectionContent: null,
      reflectionMessage: '',
      reflectionError: 'Too many requests',
      context: 'BTC is down 5%',
      severityAbsPct: 5,
      currentFeel: { mood: 'anxious', intensity: 3 },
      t,
    });

    expect(content?.schemaVersion).toBe(2);
    expect(content?.inquiry).toContain('?');
    expect(content?.land.length).toBeGreaterThan(0);
  });

  it('returns null on error without market context', () => {
    expect(
      resolvePauseReflectDisplayContent({
        reflectionContent: null,
        reflectionMessage: '',
        reflectionError: 'fail',
        context: null,
        severityAbsPct: 0,
        t,
      }),
    ).toBeNull();
  });
});
