import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import {
  getHolzenQueryClient,
  setHolzenQueryClient,
} from './holzen-query-client-ref';
import {
  getHolzenQueryClient as getHolzenQueryClientFromPublicQueries,
  setHolzenQueryClient as setHolzenQueryClientFromPublicQueries,
} from '@/features/pause/public-queries';

describe('holzen-query-client-ref parity', () => {
  it('public-queries re-exports registry helpers with identity binding to infrastructure module', () => {
    expect(getHolzenQueryClientFromPublicQueries).toBe(getHolzenQueryClient);
    expect(setHolzenQueryClientFromPublicQueries).toBe(setHolzenQueryClient);
  });
});
