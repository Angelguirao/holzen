import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import { supabasePauseRepository } from '@/features/pause/public-rpc';

import { reflectPauseRepository } from './pause-ritual-done-io';

describe('pause-ritual-done-io re-exports', () => {
  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });
});
