import { describe, expect, it } from 'vitest';

import { loadCompanionOrchestrateSession as loadSessionDirect } from './load-companion-orchestrate-session';

import { loadCompanionOrchestrateSession } from './pause-companion-orchestrate-session-flow';

describe('pause-companion-orchestrate-session-flow', () => {
  it('re-exports orchestrate session load from load-companion-orchestrate-session', () => {
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(loadCompanionOrchestrateSession).toBe(loadSessionDirect);
  });
});
