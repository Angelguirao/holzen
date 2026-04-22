import { describe, expect, it } from 'vitest';

import { createHolzenQueryClient, isTransientQueryFailure } from '@/lib/query-client';

describe('isTransientQueryFailure', () => {
  it('treats PostgREST errors as non-transient', () => {
    expect(isTransientQueryFailure({ name: 'PostgrestError' })).toBe(false);
  });

  it('retries transient edge function statuses and skips stable 4xx responses', () => {
    expect(
      isTransientQueryFailure({
        name: 'FunctionsHttpError',
        context: { response: { status: 429 } },
      }),
    ).toBe(true);
    expect(
      isTransientQueryFailure({
        name: 'FunctionsHttpError',
        context: { response: { status: 404 } },
      }),
    ).toBe(false);
  });

  it('treats transport failures as transient', () => {
    expect(isTransientQueryFailure(new TypeError('Failed to fetch'))).toBe(true);
  });
});

describe('createHolzenQueryClient', () => {
  it('defaults to no refetch-on-focus and bounded retry behavior', () => {
    const queryClient = createHolzenQueryClient();
    const queries = queryClient.getDefaultOptions().queries;
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(queries?.networkMode).toBe('online');

    const retry = queries?.retry;
    expect(typeof retry).toBe('function');
    expect((retry as (failureCount: number, error: unknown) => boolean)(0, new TypeError('NetworkError'))).toBe(
      true,
    );
    expect((retry as (failureCount: number, error: unknown) => boolean)(0, { name: 'PostgrestError' })).toBe(false);
    expect((retry as (failureCount: number, error: unknown) => boolean)(2, new TypeError('NetworkError'))).toBe(
      false,
    );
  });
});
