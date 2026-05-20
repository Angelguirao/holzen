import { describe, expect, it, vi } from 'vitest';
import {
  runCompanionSlotOrchestrate,
  type RunCompanionSlotOrchestratePorts,
} from './run-companion-slot-orchestrate';
import type { CompanionOrchestrateSessionContext } from '../ritual/frame/build-companion-orchestrate-body';

const session: CompanionOrchestrateSessionContext = {
  pauseInstanceId: 'pause-abc',
  context: 'btc dip',
  language: 'en',
  reflectionMessage: 'steady',
  mood: 'anxious',
  severity: 12,
  moodHistory: [{ mood: 'calm' }],
};

function ports(
  invoke: RunCompanionSlotOrchestratePorts['invoke'],
  overrides?: Partial<RunCompanionSlotOrchestratePorts>,
): RunCompanionSlotOrchestratePorts {
  return {
    invoke,
    loadSignalSources: vi.fn(async () => [{ name: 'Src', type: 'rss', url: 'https://a.test' }]),
    loadGroundingSources: vi.fn(async () => []),
    ...overrides,
  };
}

describe('runCompanionSlotOrchestrate', () => {
  it('returns failure when invoke returns an error payload', async () => {
    const result = await runCompanionSlotOrchestrate(
      'lazy_fetch',
      'signal',
      session,
      ports(async () => ({
        data: { error: 'quota', code: 'companions_quota_exceeded' },
        error: null,
      })),
    );
    expect(result.status).toBe('failure');
    if (result.status === 'failure') {
      expect(result.failure.isPaywall).toBe(true);
      expect(result.failure.kind).toBe('lazy_fetch');
    }
  });

  it('returns success with hasFilledSlot when body includes slot data', async () => {
    const result = await runCompanionSlotOrchestrate(
      'regenerate',
      'signal',
      session,
      ports(async () => ({
        data: {
          signal: {
            source: 'live',
            data: { title: 'T', body: 'B', source: 'wire', url: 'https://x.test' },
          },
        },
        error: null,
      })),
    );
    expect(result).toEqual({
      status: 'success',
      body: {
        signal: {
          source: 'live',
          data: { title: 'T', body: 'B', source: 'wire', url: 'https://x.test' },
        },
      },
      hasFilledSlot: true,
    });
  });

  it('loads signal sources only for signal slot', async () => {
    const loadSignalSources = vi.fn(async () => []);
    const loadGroundingSources = vi.fn(async () => []);
    await runCompanionSlotOrchestrate(
      'lazy_fetch',
      'grounding',
      session,
      ports(
        async () => ({ data: { grounding: { source: 'empty' } }, error: null }),
        { loadSignalSources, loadGroundingSources },
      ),
    );
    expect(loadSignalSources).not.toHaveBeenCalled();
    expect(loadGroundingSources).toHaveBeenCalled();
  });
});
