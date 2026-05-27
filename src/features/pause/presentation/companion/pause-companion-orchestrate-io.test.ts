import { describe, expect, it, vi } from 'vitest';

const runCompanionSlotOrchestrateMock = vi.hoisted(() => vi.fn());

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
  runCompanionSlotOrchestrate,
} from './pause-companion-orchestrate-io';

describe('pause-companion-orchestrate-io', () => {
  it('re-exports frame orchestration helpers for companion presentation hooks', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({
      grounding: null,
      signal: null,
    });
  });

  it('imports slot orchestrate from ritual/frame leaf modules', () => {
    expect(runCompanionSlotOrchestrate).toBe(runCompanionSlotOrchestrateMock);
  });

  it('sibling cluster: frame-ui-io exports stay distinct from orchestrate-io', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(getCompanionSectionVisibility);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).not.toBe(getCompanionSectionVisibility);
    expect(isCompanionSectionVisible).not.toBe(runCompanionSlotOrchestrate);
    // Full cross-I/O pins: `pause-companion-orchestrate-frame-ui-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: analytics-io exports stay distinct from orchestrate-io', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(logCompanionFeedbackVote);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).not.toBe(logCompanionFeedbackVote);
    expect(logCompanionFullviewOpened).not.toBe(runCompanionSlotOrchestrate);
    // Reciprocal inline pins: `pause-companion-analytics-io.test.ts`;
    // dedicated sibling: `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts`.
  });
});
