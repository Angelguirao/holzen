import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import { getPendingPauseOfferDisplay } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import { getPendingPauseOfferDisplay as getDisplayFromPendingOfferIo } from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';

describe('pause-reflect-pending-offer-io parity', () => {
  it('presentation I/O pending-offer display matches pending-offer CI umbrella', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferIo);
  });
});
