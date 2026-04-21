import { QueryClient } from '@tanstack/react-query';

/**
 * Heuristic for TanStack Query retries: avoid hammering 4xx / business PostgREST errors;
 * still retry likely network / 5xx / edge transient failures.
 */
export function isTransientQueryFailure(error: unknown): boolean {
  if (error == null) return false;

  const o = error as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name : '';
  const message = error instanceof Error ? error.message : String(error);

  if (name === 'PostgrestError') return false;

  if (name === 'FunctionsHttpError') {
    const ctx = o.context as { response?: Response } | undefined;
    const status = ctx?.response?.status;
    if (typeof status === 'number') {
      if (status === 408 || status === 429 || status >= 500) return true;
      if (status >= 400 && status < 500) return false;
    }
    return true;
  }

  if (name === 'AuthApiError' || name === 'AuthError') {
    const status = typeof o.status === 'number' ? o.status : undefined;
    if (status !== undefined && status >= 400 && status < 500) return false;
    return true;
  }

  if (error instanceof TypeError) return true;
  if (/Failed to fetch|NetworkError|load failed|ECONNRESET|ETIMEDOUT|timed out/i.test(message)) return true;

  return false;
}

function queryRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  return isTransientQueryFailure(error);
}

export function createHolzenQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'online',
        retry: queryRetry,
        // Default true caused widgets to refetch on every micro focus change
        // (devtools click, iframe blur, etc.) producing a visible "blink".
        // Opt back in per-query where freshness on focus actually matters.
        refetchOnWindowFocus: false,
      },
      mutations: {
        networkMode: 'online',
        retry: 0,
      },
    },
  });
}
