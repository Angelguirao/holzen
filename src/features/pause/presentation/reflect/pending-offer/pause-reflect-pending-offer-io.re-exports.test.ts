import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import { getPendingPauseOfferDisplay as getDisplayDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display';
import { getPendingPauseOfferDisplay as getDisplayFromPendingOfferFlow } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  getPendingPauseOfferDisplay,
  reflectPauseRepository,
} from './pause-reflect-pending-offer-io';

describe('pause-reflect-pending-offer-io re-exports', () => {
  it('re-exports pending-offer display from pending-pause-offer-display leaf module', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(getPendingPauseOfferDisplay).toBe(getDisplayDirect);
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O bindings match pause-reflect-pending-offer-flow CI anchor (leaf parity)', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferFlow);
  });
});
