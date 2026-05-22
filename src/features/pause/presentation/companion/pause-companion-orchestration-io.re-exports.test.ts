import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

import { invalidateCompanionUiCompletionQuery as invalidateQueryDirect } from '@/features/pause/infrastructure/queries/companion/companion-ui-completion-query-key';
import { loadCompanionOrchestrateSession as loadSessionDirect } from '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session';
import { nextExpandedWithLazyFetch as nextExpandedDirect } from '@/features/pause/application/use-cases/ritual/frame/next-expanded-with-lazy-fetch';
import {
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationFlow,
  nextExpandedWithLazyFetch as nextExpandedFromOrchestrationFlow,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow';
import {
  supabaseCompanionOrchestrator,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

import {
  companionOrchestrator,
  companionPauseRepository,
  invalidateCompanionUiCompletionQuery,
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
} from './pause-companion-orchestration-io';

describe('pause-companion-orchestration-io re-exports', () => {
  it('re-exports ritual/frame leaf modules with identity bindings', () => {
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof invalidateCompanionUiCompletionQuery).toBe('function');

    expect(loadCompanionOrchestrateSession).toBe(loadSessionDirect);
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedDirect);
    expect(invalidateCompanionUiCompletionQuery).toBe(invalidateQueryDirect);
  });

  it('re-exports default ports from public-rpc', () => {
    expect(companionOrchestrator).toBe(supabaseCompanionOrchestrator);
    expect(companionPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O bindings match pause-companion-orchestration-flow CI anchor (leaf parity)', () => {
    expect(loadCompanionOrchestrateSession).toBe(loadSessionFromOrchestrationFlow);
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedFromOrchestrationFlow);
  });
});
