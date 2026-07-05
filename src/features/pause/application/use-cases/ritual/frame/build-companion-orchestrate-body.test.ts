import { describe, expect, it } from 'vitest';
import {
  buildCompanionOrchestrateSessionFromRitual,
  buildLazyFetchOrchestrateBody,
  buildRegenerateOrchestrateBody,
  type CompanionOrchestrateSessionContext,
} from './build-companion-orchestrate-body';

const session: CompanionOrchestrateSessionContext = {
  pauseInstanceId: 'pause-abc',
  context: 'btc dip',
  language: 'en',
  reflectionMessage: 'steady',
  mood: 'anxious',
  severity: 12,
  moodHistory: [{ mood: 'calm' }],
};

const recency = {
  recentSignalSources: [],
  recentSignalTitles: [],
  recentSignalUrls: [],
  recentNudgeTopics: [],
  recentGroundingSources: [],
  recentHistoryTitles: [],
  recentZoomOutTitles: [],
};

describe('buildCompanionOrchestrateSessionFromRitual', () => {
  it('coalesces null ritual inputs to defaults', () => {
    expect(
      buildCompanionOrchestrateSessionFromRitual({
        pauseInstanceId: 'p1',
        language: 'en',
        moodHistory: [],
      }),
    ).toEqual({
      pauseInstanceId: 'p1',
      context: '',
      language: 'en',
      reflectionMessage: '',
      mood: null,
      severity: 0,
      moodHistory: [],
    });
  });
});

describe('buildLazyFetchOrchestrateBody', () => {
  it('enables only the tapped slot', () => {
    expect(
      buildLazyFetchOrchestrateBody(session, 'signal', { recency }),
    ).toMatchObject({
      holzenInvokeSource: 'browser_lazy_fetch',
      enableSignal: true,
      enableGrounding: false,
      enableHistory: false,
      enableZoomOut: false,
      useIntervention: false,
    });
  });
});

describe('buildRegenerateOrchestrateBody', () => {
  it('sets regenerateOnly and spreads recency', () => {
    expect(
      buildRegenerateOrchestrateBody(session, 'zoomOut', { recency }),
    ).toMatchObject({
      holzenInvokeSource: 'browser_regenerate',
      regenerateOnly: 'zoomOut',
      recentZoomOutTitles: [],
    });
  });
});
