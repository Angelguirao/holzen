import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import {
  getHolzenQueryClient,
  setHolzenQueryClient,
} from '@/lib/holzen-query-client-ref';
import {
  getHolzenQueryClient as getFromPublicQueries,
  setHolzenQueryClient as setFromPublicQueries,
} from '@/features/pause/public-queries';

describe('holzen-query-client-ref lib shim', () => {
  it('re-exports pause query client registry with identity binding', () => {
    expect(getHolzenQueryClient).toBe(getFromPublicQueries);
    expect(setHolzenQueryClient).toBe(setFromPublicQueries);
  });
});
