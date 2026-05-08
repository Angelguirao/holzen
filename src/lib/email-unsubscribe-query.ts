/**
 * One-click email unsubscribe deep link: GET `handle-email-unsubscribe?token=…`
 * via `invokeEdge` (anon + `x-cid`) to validate before the user confirms via POST.
 */

import { invokeEdge } from '@/lib/invoke-edge';

export type EmailUnsubscribeLinkCheck = 'valid' | 'already' | 'invalid';

export const EMAIL_UNSUBSCRIBE_LINK_QUERY_PREFIX = ['auth', 'email-unsubscribe', 'link'] as const;

/** Placeholder token segment when no unsubscribe token is present (query disabled). */
export const EMAIL_UNSUBSCRIBE_LINK_DISABLED_TOKEN = 'none' as const;

export const EMAIL_UNSUBSCRIBE_LINK_NONE_QUERY_KEY = [
  ...EMAIL_UNSUBSCRIBE_LINK_QUERY_PREFIX,
  EMAIL_UNSUBSCRIBE_LINK_DISABLED_TOKEN,
] as const;

export function emailUnsubscribeLinkQueryKey(token: string) {
  return [...EMAIL_UNSUBSCRIBE_LINK_QUERY_PREFIX, token] as const;
}

export async function fetchEmailUnsubscribeLinkCheck(
  token: string,
  signal?: AbortSignal,
): Promise<EmailUnsubscribeLinkCheck> {
  try {
    const { data, error } = await invokeEdge<{ valid?: boolean; reason?: string }>('handle-email-unsubscribe', {
      method: 'GET',
      query: { token },
      signal,
    });
    if (error) return 'invalid';
    if (data?.valid) return 'valid';
    if (data?.reason === 'already_unsubscribed') return 'already';
    return 'invalid';
  } catch {
    return 'invalid';
  }
}

export function getEmailUnsubscribeLinkQueryOptions(token: string | null) {
  return {
    queryKey: token ? emailUnsubscribeLinkQueryKey(token) : EMAIL_UNSUBSCRIBE_LINK_NONE_QUERY_KEY,
    queryFn: ({ signal }) => fetchEmailUnsubscribeLinkCheck(token!, signal),
    enabled: Boolean(token),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
