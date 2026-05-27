import { describe, expect, it } from 'vitest';
import { buildReflectClientFallback } from './build-reflect-client-fallback';
import { reflectionContentV2 } from './reflection-content-v2';
import {
  formatReflectIntegratedProse,
  stitchReflectFieldsForDisplay,
} from './format-reflect-integrated-prose';

describe('formatReflectIntegratedProse', () => {
  it('prefers integrated message over stitched fields', () => {
    const content = reflectionContentV2({
      land: 'Land only.',
      hypothesis: 'Hypothesis only.',
      inquiry: 'Stitch question',
      contextStrip: null,
      integratedMessage:
        'The move feels personal, not just statistical. What story are you telling yourself about this dip?',
    });
    const prose = formatReflectIntegratedProse(content);
    expect(prose).toContain('feels personal');
    expect(prose).not.toContain('Land only.');
    expect(prose).not.toContain('Hypothesis only.');
  });

  it('stitches fields when message is empty', () => {
    const content = reflectionContentV2({
      land: 'The move is sharp.',
      hypothesis: 'This might feel personal.',
      inquiry: 'What story are you telling yourself?',
      contextStrip: 'Some traders watch flows.',
    });
    const prose = formatReflectIntegratedProse(content);
    expect(prose).toBe(
      `${stitchReflectFieldsForDisplay(content)}\n\nSome traders watch flows.`,
    );
  });

  it('appends context strip after live integrated message with hypothesis', () => {
    const content = reflectionContentV2({
      land: 'a',
      hypothesis: 'Underneath might be fear.',
      inquiry: 'b',
      contextStrip: 'Market context line.',
      integratedMessage: 'Live voice with multiple ideas woven together.',
    });
    expect(formatReflectIntegratedProse(content)).toBe(
      'Live voice with multiple ideas woven together.\n\nMarket context line.',
    );
  });

  it('omits context strip for client-style fallback (strip null, single paragraph)', () => {
    const content = buildReflectClientFallback({
      context: 'BTC is down 3%',
      severityAbsPct: 3,
      currentFeel: { mood: 'calm' },
    });
    expect(formatReflectIntegratedProse(content)).toBe(content.message);
    expect(formatReflectIntegratedProse(content)).not.toContain('\n\n');
  });

  it('appends context strip after multi-paragraph live message', () => {
    const content = reflectionContentV2({
      land: 'a',
      hypothesis: 'Underneath.',
      inquiry: 'b?',
      contextStrip: 'Market context line.',
      integratedMessage: 'Para one.\n\nPara two with a question at the end?',
    });
    expect(formatReflectIntegratedProse(content)).toBe(
      'Para one.\n\nPara two with a question at the end?\n\nMarket context line.',
    );
  });
});
