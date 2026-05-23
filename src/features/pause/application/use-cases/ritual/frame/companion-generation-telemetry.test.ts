import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  trackCompanionGenerationInitiated,
  trackCompanionServed,
} from './companion-generation-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('companion-generation-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks generation.initiated for lazy fetch', () => {
    trackCompanionGenerationInitiated('signal', 'lazy_fetch');
    expect(trackEvent).toHaveBeenCalledWith('generation.initiated', {
      companion_type: 'signal',
      source: 'lazy',
    });
  });

  it('tracks generation.initiated for regenerate', () => {
    trackCompanionGenerationInitiated('grounding', 'regenerate');
    expect(trackEvent).toHaveBeenCalledWith('generation.initiated', {
      companion_type: 'grounding',
      source: 'regenerate',
    });
  });

  it('tracks companion.served with slot and source', () => {
    trackCompanionServed('history', 'cache');
    expect(trackEvent).toHaveBeenCalledWith('companion.served', {
      companion_type: 'history',
      source: 'cache',
      slot: 'history',
    });
  });
});
