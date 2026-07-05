export const PUSH_SUBSCRIPTION_QUERY_PREFIX = ['push', 'subscription'] as const;

export const PUSH_SUBSCRIPTION_DISABLED_USER_ID = '__none__' as const;

export const PUSH_SUBSCRIPTION_NONE_QUERY_KEY = [
  ...PUSH_SUBSCRIPTION_QUERY_PREFIX,
  PUSH_SUBSCRIPTION_DISABLED_USER_ID,
] as const;

export function pushSubscriptionQueryKey(userId: string) {
  return [...PUSH_SUBSCRIPTION_QUERY_PREFIX, userId] as const;
}

export async function fetchBrowserPushSubscribed(): Promise<boolean> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return Boolean(sub);
}

export function getPushSubscriptionQueryOptions(input: { userId: string | undefined; enabled: boolean }) {
  const { userId, enabled } = input;
  return {
    queryKey: userId ? pushSubscriptionQueryKey(userId) : PUSH_SUBSCRIPTION_NONE_QUERY_KEY,
    queryFn: fetchBrowserPushSubscribed,
    enabled,
    // Subscribe/unsubscribe updates cache via setQueryData in usePushNotifications.
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  } as const;
}
