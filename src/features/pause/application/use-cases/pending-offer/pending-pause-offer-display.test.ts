import { describe, expect, it } from 'vitest';
import { getPendingPauseOfferDisplay } from './pending-pause-offer-display';

describe('getPendingPauseOfferDisplay', () => {
  it('hides preview when it duplicates context', () => {
    const r = getPendingPauseOfferDisplay({
      preview_message: 'Same line',
      context_snapshot: { context_text: 'Same line' },
    });
    expect(r.contextText).toBe('Same line');
    expect(r.showPreviewLine).toBe(false);
  });

  it('shows preview when distinct from context', () => {
    const r = getPendingPauseOfferDisplay({
      preview_message: 'Preview only',
      context_snapshot: { context_text: 'Context line' },
    });
    expect(r.showPreviewLine).toBe(true);
    expect(r.previewMessage).toBe('Preview only');
  });
});
