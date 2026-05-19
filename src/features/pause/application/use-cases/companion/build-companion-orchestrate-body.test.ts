import { describe, expect, it } from 'vitest';
import {
  buildInterventionOrchestrateBody,
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

describe('buildInterventionOrchestrateBody', () => {
  it('requests intervention only with companions disabled', () => {
    expect(buildInterventionOrchestrateBody(session)).toMatchObject({
      holzenInvokeSource: 'browser_pause_intervention',
      pauseInstanceId: 'pause-abc',
      useIntervention: true,
      enableSignal: false,
      enableGrounding: false,
      enableHistory: false,
      enableZoomOut: false,
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
