import { invokeEdge } from '@/lib/invoke-edge';

export type RegisterPushVapidKeyResponse = { publicKey?: string };

export type PushSubscriptionKeys = {
  p256dh?: string;
  auth?: string;
};

export type RegisterPushSubscribeBody = {
  endpoint?: string;
  keys?: PushSubscriptionKeys;
};

/** Fetch VAPID public key for browser `PushManager.subscribe` (`register-push` edge). */
export function getRegisterPushVapidKey() {
  return invokeEdge<RegisterPushVapidKeyResponse>('register-push', {
    body: { action: 'get-vapid-key' },
  });
}

/** Persist push subscription for signed-in user (`register-push` edge; `x-cid` via `invokeEdge`). */
export function registerPushSubscribe(subscription: RegisterPushSubscribeBody) {
  return invokeEdge('register-push', {
    body: {
      action: 'subscribe',
      subscription,
    },
  });
}

/** Remove push subscription row for signed-in user (`register-push` edge). */
export function registerPushUnsubscribe(subscription: { endpoint?: string }) {
  return invokeEdge('register-push', {
    body: {
      action: 'unsubscribe',
      subscription,
    },
  });
}
