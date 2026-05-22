import { describe, expect, it, vi } from 'vitest';

const runCompanionSlotOrchestrateMock = vi.hoisted(() => vi.fn());
const runCompanionInterventionBootstrapMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow')
    >();
    return {
      ...actual,
      runCompanionSlotOrchestrate: runCompanionSlotOrchestrateMock,
      runCompanionInterventionBootstrap: runCompanionInterventionBootstrapMock,
    };
  },
);

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

  it('imports slot orchestrate and intervention bootstrap via orchestrate-flow anchor', () => {
    expect(runCompanionSlotOrchestrate).toBe(runCompanionSlotOrchestrateMock);
    expect(runCompanionInterventionBootstrap).toBe(runCompanionInterventionBootstrapMock);
  });
});
