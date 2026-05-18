import { PAUSE_QUERY_PREFIX } from './pause-query-namespace';

export const PENDING_PAUSE_OFFER_QUERY_LEAF = 'pending-offer' as const;

export const PENDING_PAUSE_OFFER_QUERY_PREFIX = [
  ...PAUSE_QUERY_PREFIX,
  PENDING_PAUSE_OFFER_QUERY_LEAF,
] as const;

export const PENDING_PAUSE_OFFER_DISABLED_USER_ID = 'none' as const;

export const PENDING_PAUSE_OFFER_NONE_QUERY_KEY = [
  ...PENDING_PAUSE_OFFER_QUERY_PREFIX,
  PENDING_PAUSE_OFFER_DISABLED_USER_ID,
] as const;

export function pendingPauseOfferQueryKey(userId: string) {
  return [...PENDING_PAUSE_OFFER_QUERY_PREFIX, userId] as const;
}
