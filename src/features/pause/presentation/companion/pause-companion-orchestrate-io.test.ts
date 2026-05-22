import { describe, expect, it, vi } from 'vitest';

const runCompanionSlotOrchestrateMock = vi.hoisted(() => vi.fn());
const runCompanionInterventionBootstrapMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate')
    >();
    return {
      ...actual,
      runCompanionSlotOrchestrate: runCompanionSlotOrchestrateMock,
    };
  },
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap')
    >();
    return {
      ...actual,
      runCompanionInterventionBootstrap: runCompanionInterventionBootstrapMock,
    };
  },
);

vi.mock('./pause-companion-orchestration-io', () => ({
  companionOrchestrator: { port: 'companionOrchestrator' },
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
}));

const runLogCompanionFeedbackVoteMock = vi.hoisted(() => vi.fn());
const runLogCompanionFullviewOpenedMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote',
  () => ({
    runLogCompanionFeedbackVote: runLogCompanionFeedbackVoteMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened',
  () => ({
    runLogCompanionFullviewOpened: runLogCompanionFullviewOpenedMock,
  }),
);

import {
  logCompanionFeedbackVote,
  logCompanionFullviewOpened,
} from './pause-companion-analytics-io';
import {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './pause-companion-frame-ui-io';
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

  it('imports slot orchestrate and intervention bootstrap from ritual/frame leaf modules', () => {
    expect(runCompanionSlotOrchestrate).toBe(runCompanionSlotOrchestrateMock);
    expect(runCompanionInterventionBootstrap).toBe(runCompanionInterventionBootstrapMock);
  });

  it('sibling cluster: frame-ui-io exports stay distinct from orchestrate-io', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(getCompanionSectionVisibility);
    expect(runCompanionInterventionBootstrap).not.toBe(isCompanionSectionVisible);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).not.toBe(getCompanionSectionVisibility);
    // Full cross-I/O pins: `pause-companion-orchestrate-frame-ui-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: analytics-io exports stay distinct from orchestrate-io', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(logCompanionFeedbackVote);
    expect(runCompanionInterventionBootstrap).not.toBe(logCompanionFullviewOpened);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).not.toBe(logCompanionFeedbackVote);
    // Reciprocal inline pins: `pause-companion-analytics-io.test.ts`;
    // dedicated sibling: `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts`.
  });
});
