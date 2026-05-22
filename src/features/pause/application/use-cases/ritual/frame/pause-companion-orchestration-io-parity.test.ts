import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow';
import {
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationIo,
  nextExpandedWithLazyFetch as nextExpandedFromOrchestrationIo,
} from '@/features/pause/presentation/companion/pause-companion-orchestration-io';

describe('pause-companion-orchestration-io parity', () => {
  it('presentation I/O orchestration exports match pause-companion-orchestration-flow CI umbrella', () => {
    expect(loadCompanionOrchestrateSession).toBe(loadSessionFromOrchestrationIo);
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedFromOrchestrationIo);
  });
});
