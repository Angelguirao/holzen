import { invokeEdge } from '@/lib/invoke-edge';

export type EmailUnsubscribeLinkResponse = { valid?: boolean; reason?: string };

export type EmailUnsubscribeConfirmResponse = { success?: boolean; reason?: string };

/** GET link validation (`handle-email-unsubscribe` edge; anon + `x-cid`). */
export function fetchEmailUnsubscribeLink(token: string, signal?: AbortSignal) {
  return invokeEdge<EmailUnsubscribeLinkResponse>('handle-email-unsubscribe', {
    method: 'GET',
    query: { token },
    signal,
  });
}

/** POST confirm unsubscribe (`handle-email-unsubscribe` edge). */
export function confirmEmailUnsubscribe(token: string) {
  return invokeEdge<EmailUnsubscribeConfirmResponse>('handle-email-unsubscribe', {
    body: { token },
  });
}
