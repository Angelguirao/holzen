import { describe, expect, it, vi } from 'vitest';

vi.mock('./pause-companion-orchestration-io', () => ({
  companionOrchestrator: { port: 'companionOrchestrator' },
}));

import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
} from './pause-companion-orchestrate-io';

describe('pause-companion-orchestrate-io', () => {
  it('re-exports frame orchestration helpers for companion presentation hooks', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof runCompanionInterventionBootstrap).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({
      nudge: null,
      signal: null,
    });
  });
});
