/**
 * One-click email unsubscribe deep link: GET `handle-email-unsubscribe?token=…`
 * (anon key) to validate before the user confirms via `invokeEdge` POST.
 */

export type EmailUnsubscribeLinkCheck = 'valid' | 'already' | 'invalid';

export const EMAIL_UNSUBSCRIBE_LINK_NONE_QUERY_KEY = ['auth', 'email-unsubscribe', 'link', 'none'] as const;

export function emailUnsubscribeLinkQueryKey(token: string) {
  return ['auth', 'email-unsubscribe', 'link', token] as const;
}

export async function fetchEmailUnsubscribeLinkCheck(token: string): Promise<EmailUnsubscribeLinkCheck> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const res = await fetch(
      `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
      { headers: { apikey: anonKey } },
    );
    let data: { valid?: boolean; reason?: string };
    try {
      data = await res.json();
    } catch {
      return 'invalid';
    }
    if (data.valid) return 'valid';
    if (data.reason === 'already_unsubscribed') return 'already';
    return 'invalid';
  } catch {
    return 'invalid';
  }
}

export function getEmailUnsubscribeLinkQueryOptions(token: string | null) {
  return {
    queryKey: token ? emailUnsubscribeLinkQueryKey(token) : EMAIL_UNSUBSCRIBE_LINK_NONE_QUERY_KEY,
    queryFn: () => fetchEmailUnsubscribeLinkCheck(token!),
    enabled: Boolean(token),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
