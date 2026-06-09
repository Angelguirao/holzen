import { describe, expect, it } from 'vitest';
import {
  companionSlotHasDisplayableContent,
  hasDisplayableGroundingContent,
  hasDisplayableZoomOutContent,
} from './companion-slot-display-content';

describe('companionSlotHasDisplayableContent', () => {
  it('treats empty grounding shell as not displayable', () => {
    expect(hasDisplayableGroundingContent({ title: '', body: '', citation: '', url: '' })).toBe(false);
    expect(companionSlotHasDisplayableContent('grounding', { title: '', body: '' })).toBe(false);
  });

  it('accepts grounding with body or title', () => {
    expect(hasDisplayableGroundingContent({ title: '', body: 'Breathe', citation: '', url: '' })).toBe(
      true,
    );
  });

  it('treats empty zoom-out shell as not displayable', () => {
    expect(
      hasDisplayableZoomOutContent({ onThisDay: [], currentPrice: null, echo: null, deepTime: null }),
    ).toBe(false);
  });

  it('accepts zoom-out deep time or echo', () => {
    expect(
      hasDisplayableZoomOutContent({
        onThisDay: [],
        currentPrice: null,
        echo: null,
        deepTime: { title: 'T', body: 'B' },
      }),
    ).toBe(true);
  });
});
