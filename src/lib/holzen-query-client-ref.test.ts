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

describe('holzen-query-client-ref lib shim', () => {
  it('re-exports registry helpers with identity binding to public-queries', () => {
    expect(setHolzenQueryClient).toBe(setHolzenQueryClientFromPublicQueries);
    expect(getHolzenQueryClient).toBe(getHolzenQueryClientFromPublicQueries);
  });
});
