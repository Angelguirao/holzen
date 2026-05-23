import { describe, expect, it, vi } from 'vitest';

const orchestrationIoStubs = vi.hoisted(() => ({
  pauseLoadCompanionOrchestrateSession: vi.fn(),
  pauseToggleCompanionLibraryFavorite: vi.fn(),
  nextExpandedWithLazyFetch: vi.fn(),
}));

vi.mock('./pause-companion-orchestration-io', () => ({
  companionOrchestrator: { port: 'companionOrchestrator' },
  ...orchestrationIoStubs,
}));

import {
  runCompanionSlotOrchestrate,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-io';
const {
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
  nextExpandedWithLazyFetch,
} = orchestrationIoStubs;
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './pause-companion-frame-ui-io';

describe('pause-companion-frame-ui-io', () => {
  it('re-exports frame UI helpers from ritual/frame leaf modules', () => {
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBeGreaterThan(0);
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
  });

  it('sibling cluster: orchestrate-io exports stay distinct from frame-ui-io', () => {
    expect(getCompanionSectionVisibility).not.toBe(runCompanionSlotOrchestrate);
    expect(isCompanionSectionVisible).not.toBe(trackCompanionGenerationInitiated);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).not.toBe(runCompanionSlotOrchestrate);
    // Full cross-I/O pins: `pause-companion-orchestrate-frame-ui-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: orchestration-io exports stay distinct from frame-ui-io', () => {
    expect(getCompanionSectionVisibility).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(isCompanionSectionVisible).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).not.toBe(nextExpandedWithLazyFetch);
    // Reciprocal inline pins: `pause-companion-orchestration-io.test.ts`;
    // dedicated sibling: `pause-companion-frame-ui-orchestration-io-sibling-parity.test.ts`.
  });
});
