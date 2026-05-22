import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer', () => ({
  runAdoptPendingPauseOffer: vi.fn(() => Promise.resolve({ status: 'adopted' as const })),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer', () => ({
  runDeclinePendingPauseOffer: vi.fn(() => Promise.resolve({ status: 'declined' as const })),
}));

import { runAdoptPendingPauseOffer as runAdoptDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferIo,
  pauseAdoptPendingOffer,
  pauseDeclinePendingOffer,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-reflect-pending-offer-io parity', () => {
  it('presentation I/O pending-offer display matches pending-offer CI umbrella', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferIo);
  });

  it('pending-offer CI umbrella composes the same run-* leaf use cases as presentation I/O', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('pauseAdoptPendingOffer delegates to run-adopt-pending-pause-offer with default repository', async () => {
    await pauseAdoptPendingOffer();

    expect(runAdoptDirect).toHaveBeenCalledWith(supabasePauseRepository);
  });

  it('pauseDeclinePendingOffer delegates to run-decline-pending-pause-offer with default repository', async () => {
    await pauseDeclinePendingOffer();

    expect(runDeclineDirect).toHaveBeenCalledWith(supabasePauseRepository);
  });
});
