import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'archivePauseRepository' },
}));

import { trackPauseOutcomeRetrospective } from '@/features/pause/application/use-cases/ritual/decide/pause-archive-decide-flow';
import {
  archivePauseRepository,
  trackPauseOutcomeRetrospective as trackRetrospectiveFromArchiveIo,
} from '@/features/pause/presentation/archive/pause-archive-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-archive-io parity', () => {
  it('presentation I/O archive retrospective telemetry matches archive-decide-flow CI umbrella', () => {
    expect(trackPauseOutcomeRetrospective).toBe(trackRetrospectiveFromArchiveIo);
  });

  it('binds default archivePauseRepository to public-rpc supabasePauseRepository', () => {
    expect(archivePauseRepository).toBe(supabasePauseRepository);
  });
});
