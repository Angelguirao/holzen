import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'archivePauseRepository' },
}));

import {
  trackPauseOutcomeRetrospective as trackRetrospectiveDirect,
} from '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry';

import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  archivePauseRepository,
  trackPauseOutcomeRetrospective,
} from './pause-archive-io';

describe('pause-archive-io re-exports', () => {
  it('re-exports retrospective PostHog tracker from ritual/decide leaf module', () => {
    expect(typeof trackPauseOutcomeRetrospective).toBe('function');
    expect(trackPauseOutcomeRetrospective).toBe(trackRetrospectiveDirect);
  });

  it('binds default archivePauseRepository to public-rpc supabasePauseRepository', () => {
    expect(archivePauseRepository).toBe(supabasePauseRepository);
  });
});
