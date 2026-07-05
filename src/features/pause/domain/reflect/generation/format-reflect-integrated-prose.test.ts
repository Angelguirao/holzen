import { describe, expect, it } from 'vitest';
import { buildReflectClientFallback } from './build-reflect-client-fallback';
import { reflectionContentV2 } from './reflection-content-v2';
import {
  formatReflectDisplayLetter,
  formatReflectIntegratedProse,
  stitchReflectFieldsForDisplay,
} from './format-reflect-integrated-prose';

describe('formatReflectDisplayLetter', () => {
  it('prefers integrated message over stitched fields', () => {
    const content = reflectionContentV2({
      land: 'Land only.',
      hypothesis: 'Hypothesis only.',
      inquiry: 'Stitch question',
      contextStrip: 'Strip hidden from letter.',
      integratedMessage:
        'That flicker of fear you named can feel heavier when doubt spreads. What story are you telling yourself about this dip?',
    });
    const prose = formatReflectDisplayLetter(content);
    expect(prose).toContain('flicker of fear');
    expect(prose).not.toContain('Land only.');
    expect(prose).not.toContain('Strip hidden');
  });

  it('one-voice stitch when message is empty', () => {
    const content = reflectionContentV2({
      land: 'The move is sharp.',
      hypothesis: 'This might feel personal.',
      inquiry: 'What story are you telling yourself?',
      contextStrip: 'Some traders watch flows.',
    });
    const prose = formatReflectDisplayLetter(content);
    expect(prose).not.toContain('\n\n');
    expect(prose).not.toContain('Some traders watch flows.');
    expect(prose).toContain('?');
  });

  it('does not append context strip to live integrated message', () => {
    const content = reflectionContentV2({
      land: 'a',
      hypothesis: 'Underneath might be fear.',
      inquiry: 'b',
      contextStrip: 'Market context line.',
      integratedMessage: 'Live voice with multiple ideas woven together.',
    });
    expect(formatReflectDisplayLetter(content)).toBe('Live voice with multiple ideas woven together.');
  });

  it('client fallback is one paragraph without context strip', () => {
    const content = buildReflectClientFallback({
      context: 'BTC is down 3%',
      severityAbsPct: 3,
      currentFeel: { mood: 'calm' },
    });
    expect(formatReflectDisplayLetter(content)).toBe(content.message);
    expect(formatReflectDisplayLetter(content)).not.toContain('\n\n');
  });

  it('normalizes triple-paragraph LLM output before final question', () => {
    const content = reflectionContentV2({
      land: 'a',
      hypothesis: 'b',
      inquiry: 'c?',
      contextStrip: null,
      integratedMessage: 'Para one.\n\nPara two.\n\nWhat story are you telling yourself?',
    });
    expect(formatReflectDisplayLetter(content)).toBe(
      'Para one. Para two.\n\nWhat story are you telling yourself?',
    );
  });
});

describe('formatReflectIntegratedProse alias', () => {
  it('matches formatReflectDisplayLetter', () => {
    const content = reflectionContentV2({
      land: 'x',
      hypothesis: 'y',
      inquiry: 'z?',
      integratedMessage: 'Same output.',
    });
    expect(formatReflectIntegratedProse(content)).toBe(formatReflectDisplayLetter(content));
  });
});

describe('stitchReflectFieldsForDisplay', () => {
  it('keeps legacy paragraph stitch for internal tests', () => {
    const content = reflectionContentV2({
      land: 'The move is sharp.',
      hypothesis: 'This might feel personal.',
      inquiry: 'What story are you telling yourself?',
      contextStrip: null,
    });
    expect(stitchReflectFieldsForDisplay(content)).toContain('\n\n');
  });
});
